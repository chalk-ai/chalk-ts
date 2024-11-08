import { parseFeatherQueryResponse } from "./_bulk_response";
import { DEFAULT_API_SERVER } from "./_const";
import { ChalkError } from "./_errors";
import {
  IntermediateRequestBodyJSON,
  serializeMultipleQueryInputFeather,
} from "./_feather";
import { ChalkHttpHeaders, ChalkHTTPService, CredentialsHolder } from "./_http";
import {
  ChalkClientInterface,
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
import {
  ChalkClientConfig,
  ChalkEnvironmentVariables,
  ChalkScalar,
  CustomFetchClient,
} from "./_types";
import { parseOnlineQueryResponse } from "./_response";

export interface ChalkClientOpts {
  /**
   * Your Chalk Client ID. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientId?: string;

  /**
   * Your Chalk Client Secret. This value will be read from the _CHALK_CLIENT_SECRET environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientSecret?: string;

  /**
   * The URL of your chalk API server. Defaults to https://api.chalk.ai
   */
  apiServer?: string;

  /**
   * For customers with isolated query infrastructure, the URL of the server to direct query-related traffic to.
   * Authentication and metadata plane traffic will continue to route to apiServer.
   */
  queryServer?: string;

  /**
   * The environment that your client will run against.
   * This value will be read from the _CHALK_ACTIVE_ENVIRONMENT environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  activeEnvironment?: string;

  /**
   * If specified, Chalk will route all requests from this client instance to the relevant branch.
   * This value will be read from the _CHALK_BRANCH environment variable if not set explicitly.
   *
   * Some methods allow you to override this instance-level branch configuration by passing in a `branch` argument.
   */
  branch?: string;

  /**
   * Additional headers to include in all requests made by this client instance.
   */
  additionalHeaders?: Record<string, string>;

  /**
   * A custom fetch client that will replace the fetch polyfill used by default.
   *
   * If not provided, the client will use the default fetch polyfill (native fetch with node-fetch as a fallback).
   */
  fetch?: CustomFetchClient;

  /**
   * A custom fetch headers object that will replace the fetch Headers polyfill used by default. This is primarily for use
   * with a custom fetch client, and is not the preferred way to add additional headers to requests.
   *
   * If not provided, the client will use the default fetch Headers polyfill (native fetch with node-fetch as a fallback).
   */
  fetchHeaders?: typeof Headers;

  /**
   * The format to use for date-type data.
   *
   * Defaults to "ISO_8601" (in UTC), also supports "EPOCH_MILLIS" as number of milliseconds since epoch
   */
  timestampFormat?: ChalkClientConfig["timestampFormat"];

  defaultTimeout?: number;
}

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
  additionalHeaders?: Record<string, string>;
}

export class ChalkClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly credentials: CredentialsHolder;
  constructor(opts?: ChalkClientOpts) {
    const resolvedApiServer: string =
      opts?.apiServer ?? process.env._CHALK_API_SERVER ?? DEFAULT_API_SERVER;
    const queryServer: string =
      opts?.queryServer ?? process.env._CHALK_QUERY_SERVER ?? resolvedApiServer;

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
    };

    this.http = new ChalkHTTPService(
      opts?.fetch,
      opts?.fetchHeaders,
      opts?.defaultTimeout,
      opts?.additionalHeaders
    );

    this.credentials = new CredentialsHolder(this.config, this.http);
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
      baseUrl: this.config.queryServer,
      body: {
        inputs: request.inputs,
        outputs: request.outputs as string[],
        context: {
          tags: request.scopeTags,
        },
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
          correlation_id: request.correlationId,
          deployment_id: request.previewDeploymentId,
          meta: request.queryMeta,
          query_name: request.queryName,
          staleness: singleQuery.staleness,
        };
      }
    );

    const requestBuffer = serializeMultipleQueryInputFeather(requests);

    const rawResult = await this.http.v1_query_feather({
      baseUrl: this.config.queryServer,
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
      correlation_id: request.correlationId,
      deployment_id: request.previewDeploymentId,
      meta: request.queryMeta,
      query_name: request.queryName,
      staleness: request.staleness,
      now: request.now,
    };

    const requestBuffer = serializeMultipleQueryInputFeather([requestBody]);

    const rawResult = await this.http.v1_query_feather({
      baseUrl: this.config.queryServer,
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
      baseUrl: this.config.queryServer,
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

  private getHeaders(
    requestOptions?: ChalkRequestOptions,
  ): ChalkHttpHeaders {
    const headers: ChalkHttpHeaders = this.config.activeEnvironment
      ? {
          "X-Chalk-Env-Id": this.config.activeEnvironment,
        }
      : {};

    const branch = requestOptions?.branch ?? this.config.branch;
    if (branch != null) {
      headers["X-Chalk-Branch-Id"] = branch;
    }

    if (requestOptions?.additionalHeaders != null) {
      Object.assign(headers, requestOptions.additionalHeaders);
    }

    return headers;
  }
}
