import { parseFeatherQueryResponse } from "./_bulk_response";
import { DEFAULT_API_SERVER } from "./_const";
import { ChalkError } from "./_errors";
import {
  IntermediateRequestBodyJSON,
  serializeMultipleQueryInputFeather,
} from "./_feather";
import {
  ChalkHttpHeaders,
  ChalkHttpHeadersStrict,
  ChalkHTTPService,
  CredentialsHolder,
} from "./_http";
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
  TimestampFormat,
} from "./_interface";
import { ChalkEnvironmentVariables, ChalkScalar } from "./_interface/_types";
import { parseOnlineQueryResponse } from "./_response";
import { ChalkClientOpts } from "./_interface/_options";

function valueWithEnvFallback(
  parameterNameForDebugging: string,
  constructorValue: string | undefined,
  name: keyof ChalkEnvironmentVariables
) {
  if (constructorValue != null) {
    return constructorValue;
  }

  const envValue = process?.env?.[name];
  if (envValue != null && envValue !== "") {
    return envValue;
  }

  throw new Error(
    `Chalk client parameter '${parameterNameForDebugging}' was not specified when creating your ChalkClient, and was not present as '${name}' in process.env. This field is required to use Chalk`
  );
}

export interface ChalkRequestOptions {
  /**
   * If specified, Chalk will route this request to the relevant branch. Overrides the branch passed in to the
   * client initialization.
   */
  branch?: string;
  /**
   * The timeout for the request in milliseconds. If not provided, the client will use the default timeout
   * specified at the client level.
   */
  timeout?: number;
  /**
   * Additional headers to include in this request. These headers will be merged with the headers provided at the client level.
   */
  additionalHeaders?: ChalkHttpHeaders;
}

export class ChalkClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientHTTPInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly credentials: CredentialsHolder;
  constructor(opts?: ChalkClientOpts) {
    const resolvedApiServer: string =
      opts?.apiServer ?? process.env._CHALK_API_SERVER ?? DEFAULT_API_SERVER;
    const queryServer: string | undefined =
      opts?.queryServer ?? process.env._CHALK_QUERY_SERVER;

    this.config = {
      activeEnvironment:
        opts?.activeEnvironment ??
        process.env._CHALK_ACTIVE_ENVIRONMENT ??
        undefined,
      apiServer: resolvedApiServer,
      branch: opts?.branch ?? process.env._CHALK_BRANCH ?? undefined,
      clientId: valueWithEnvFallback(
        "clientId",
        opts?.clientId,
        "_CHALK_CLIENT_ID"
      ),
      clientSecret: valueWithEnvFallback(
        "clientSecret",
        opts?.clientSecret,
        "_CHALK_CLIENT_SECRET"
      ),
      queryServer,
      timestampFormat: opts?.timestampFormat ?? TimestampFormat.ISO_8601,
      useQueryServerFromCredentialExchange:
        opts?.useQueryServerFromCredentialExchange ?? false,
    };

    this.http = new ChalkHTTPService(
      opts?.fetch,
      opts?.fetchHeaders,
      opts?.defaultTimeout,
      opts?.additionalHeaders
    );

    this.credentials = new CredentialsHolder(this.config, this.http);
  }

  async getQueryServer(): Promise<string> {
    if (this.config.queryServer) {
      return this.config.queryServer;
    }

    if (!this.config.useQueryServerFromCredentialExchange) {
      return this.config.queryServer || this.config.apiServer;
    }

    const engineFromCredentials =
      await this.credentials.getEngineUrlFromCredentials(
        this.config.activeEnvironment
      );

    return engineFromCredentials || this.config.apiServer;
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    return this.http.v1_who_am_i({
      baseUrl: this.config.apiServer,
      headers: this.getHeaders(),
      credentials: this.credentials,
    });
  }

  async getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse> {
    return this.http.v1_get_run_status({
      baseUrl: this.config.apiServer,
      pathParams: {
        run_id: runId,
      },
      headers: this.getHeaders(),
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
      headers: this.getHeaders(),
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
        query_context: request.queryContext,
        correlation_id: request.correlationId,
        deployment_id: request.previewDeploymentId,
        meta: request.queryMeta,
        query_name: request.queryName,
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
      headers: this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
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
      headers: this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
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
      query_context: request.queryContext,
      correlation_id: request.correlationId,
      deployment_id: request.previewDeploymentId,
      meta: request.queryMeta,
      query_name: request.queryName,
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
      headers: this.getHeaders(requestOptions),
      credentials: this.credentials,
      timeout: requestOptions?.timeout,
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
      headers: this.getHeaders(),
      credentials: this.credentials,
    });

    if (rawResult.errors != null && rawResult.errors.length > 0) {
      const errorText = rawResult.errors.map((e) => e.message).join("; ");
      throw new ChalkError(errorText, {
        info: rawResult.errors,
      });
    }
  }

  private getHeaders(requestOptions?: ChalkRequestOptions): ChalkHttpHeaders {
    const headers: ChalkHttpHeadersStrict = {
      "X-Chalk-Deployment-Type": "engine",
    };

    if (this.config.activeEnvironment) {
      headers["X-Chalk-Env-Id"] = this.config.activeEnvironment;
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
