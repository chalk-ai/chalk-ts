import { parseFeatherQueryResponse } from "./_bulk_response";
import { ChalkError } from "./_errors";
import {
  IntermediateRequestBodyJSON,
  serializeMultipleQueryInputFeather,
} from "./_utils/_feather";
import { ChalkHTTPService } from "./_services/_http";
import { ChalkHttpHeaders, ChalkHttpHeadersStrict } from "./_interface/_header";
import { CredentialsHolder } from "./_services/_credentials";
import {
  ChalkClientHTTPInterface,
  ChalkClientConfig,
  ChalkGetRunStatusResponse,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineMultiQueryResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  ChalkTriggerResolverRunRequest,
  ChalkTriggerResolverRunResponse,
  ChalkUploadSingleRequest,
  ChalkWhoamiResponse,
} from "./_interface";
import { ChalkScalar } from "./_interface/_types";
import { parseOnlineQueryResponse } from "./_response";
import { ChalkClientOpts } from "./_interface/_options";
import { ChalkRequestOptions } from "./_interface/_request";
import { configFromOptionsAndEnvironment } from "./_utils/_config";

export class ChalkClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientHTTPInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly credentials: CredentialsHolder;
  constructor(opts?: ChalkClientOpts) {
    this.config = {
      ...configFromOptionsAndEnvironment(opts),
      useQueryServerFromCredentialExchange:
        opts?.useQueryServerFromCredentialExchange ?? false,
    };

    this.http = new ChalkHTTPService(
      opts?.fetch,
      opts?.fetchHeaders,
      opts?.defaultTimeout,
      opts?.additionalHeaders,
      3, // maxNetworkRetries
      opts?.retryConfig
    );

    this.credentials = new CredentialsHolder(this.config, this.http);
  }

  async getActiveEnvironment(): Promise<string | null | undefined> {
    if (this.config.activeEnvironment) {
      return this.config.activeEnvironment;
    }

    const envFromCredentials =
      await this.credentials.getPrimaryEnvironmentFromCredentials();

    return envFromCredentials;
  }

  async getQueryServer(): Promise<string> {
    if (this.config.queryServer) {
      return this.config.queryServer;
    }

    if (!this.config.useQueryServerFromCredentialExchange) {
      return this.config.queryServer || this.config.apiServer;
    }

    const primaryEnvironment = await this.getActiveEnvironment();

    const engineFromCredentials =
      await this.credentials.getEngineUrlFromCredentials(primaryEnvironment);

    return engineFromCredentials || this.config.apiServer;
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    return this.http.v1_who_am_i({
      baseUrl: this.config.apiServer,
      headers: await this.getHeaders(),
      credentials: this.credentials,
    });
  }

  async getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse> {
    return this.http.v1_get_run_status({
      baseUrl: this.config.apiServer,
      pathParams: {
        run_id: runId,
      },
      headers: await this.getHeaders(),
      credentials: this.credentials,
    });
  }

  async triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse> {
    return this.http.v1_trigger_resolver_run({
      baseUrl: this.config.apiServer,
      body: {
        resolver_fqn: request.resolverFqn,
      },
      headers: await this.getHeaders(),
      credentials: this.credentials,
    });
  }

  async query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>> {
    const rawResult = await this.http.v1_query_online({
      baseUrl: await this.getQueryServer(),
      body: {
        inputs: request.inputs,
        outputs: request.outputs as string[],
        context: {
          tags: request.scopeTags,
        },
        explain: request.explain,
        query_context: request.queryContext,
        correlation_id: request.correlationId,
        deployment_id: request.previewDeploymentId,
        meta: request.queryMeta,
        query_name: request.queryName,
        query_name_version: request.queryNameVersion,
        staleness: request.staleness,
        now: request.now,
        encoding_options: request.encodingOptions
          ? {
              encode_structs_as_objects:
                request.encodingOptions.encodeStructsAsObjects,
            }
          : undefined,
        include_meta: !!request.include_meta,
        planner_options: request.plannerOptions,
      },
      headers: await this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
      retryConfig: requestOptions?.retryConfig,
    });

    return parseOnlineQueryResponse<TFeatureMap, TOutput>(
      rawResult,
      this.config
    );
  }

  async multiQuery<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineMultiQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineMultiQueryResponse<TFeatureMap, TOutput>> {
    const requests = request.queries.map(
      (singleQuery): IntermediateRequestBodyJSON<TFeatureMap, TOutput> => {
        return {
          inputs: singleQuery.inputs,
          outputs: singleQuery.outputs,
          context: {
            tags: singleQuery.scopeTags,
          },
          query_context: request.queryContext,
          correlation_id: request.correlationId,
          deployment_id: request.previewDeploymentId,
          meta: request.queryMeta,
          query_name: request.queryName,
          query_name_version: request.queryNameVersion,
          staleness: singleQuery.staleness,
          planner_options: {
            pack_groups_into_structs: true,
            // arrow JS implementation cannot handle large lists, must send option to allow parsing
            pack_groups_avoid_large_list: true,
            ...request.plannerOptions,
          },
        };
      }
    );

    const requestBuffer = serializeMultipleQueryInputFeather(requests);

    const rawResult = await this.http.v1_query_feather({
      baseUrl: await this.getQueryServer(),
      body: requestBuffer.buffer,
      headers: await this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
      retryConfig: requestOptions?.retryConfig,
    });

    const resultBuffer = Buffer.from(rawResult);
    const parsedResult = parseFeatherQueryResponse(resultBuffer, this.config);

    return {
      responses: parsedResult,
    };
  }

  async queryBulk<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>> {
    const requestBody: IntermediateRequestBodyJSON<TFeatureMap, TOutput> = {
      inputs: request.inputs,
      outputs: request.outputs,
      context: {
        tags: request.scopeTags,
      },
      explain: request.explain,
      include_meta: request.include_meta,
      query_context: request.queryContext,
      correlation_id: request.correlationId,
      deployment_id: request.previewDeploymentId,
      meta: request.queryMeta,
      query_name: request.queryName,
      query_name_version: request.queryNameVersion,
      staleness: request.staleness,
      planner_options: {
        pack_groups_into_structs: true,
        // arrow JS implementation cannot handle large lists, must send option to allow parsing
        pack_groups_avoid_large_list: true,
        ...request.plannerOptions,
      },
      now: request.now,
    };

    const requestBuffer = serializeMultipleQueryInputFeather([requestBody]);

    const rawResult = await this.http.v1_query_feather({
      baseUrl: await this.getQueryServer(),
      body: requestBuffer.buffer,
      headers: await this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
      retryConfig: requestOptions?.retryConfig,
    });

    const resultBuffer = Buffer.from(rawResult);
    const parsedResult = parseFeatherQueryResponse(resultBuffer, this.config);
    const firstAndOnlyChunk = parsedResult[0];

    return firstAndOnlyChunk;
  }

  async uploadSingle(
    request: ChalkUploadSingleRequest<TFeatureMap>
  ): Promise<void> {
    const rawResult = await this.http.v1_upload_single({
      baseUrl: await this.getQueryServer(),
      body: {
        inputs: request.features,
        outputs: Object.keys(request.features),
        context: {
          tags: request.scopeTags,
        },
        correlation_id: request.correlationId,
        deployment_id: request.previewDeploymentId,
      },
      headers: await this.getHeaders(),
      credentials: this.credentials,
    });

    if (rawResult.errors != null && rawResult.errors.length > 0) {
      const errorText = rawResult.errors.map((e) => e.message).join("; ");
      throw new ChalkError(errorText, {
        info: rawResult.errors,
      });
    }
  }

  private async getHeaders(
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkHttpHeaders> {
    const headers: ChalkHttpHeadersStrict = {
      "X-Chalk-Deployment-Type": "engine",
    };

    const activeEnvironment = await this.getActiveEnvironment();
    if (activeEnvironment != null) {
      headers["X-Chalk-Env-Id"] = activeEnvironment;
    }

    const branch = requestOptions?.branch ?? this.config.branch;
    if (branch != null) {
      headers["X-Chalk-Branch-Id"] = branch;
    }

    if (requestOptions?.additionalHeaders != null) {
      Object.assign(headers, requestOptions.additionalHeaders);
    }

    return headers as ChalkHttpHeaders;
  }
}
