import { parseFeatherQueryResponse } from "./_bulk_response";
import { DEFAULT_API_SERVER } from "./_const";
import {
  IntermediateRequestBodyJSON,
  serializeMultipleQueryInputFeather,
  serializeSingleQueryInputFeather,
} from "./_feather";
import {
  ChalkHttpHeaders,
  ChalkHttpHeadersStrict,
  ChalkHTTPService,
  CredentialsHolder,
} from "./_http";
import {
  ChalkClientInterface,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineMultiQueryResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  TimestampFormat,
} from "./_interface";
import {
  ChalkClientConfig,
  ChalkEnvironmentVariables,
  ChalkScalar,
  CustomFetchClient,
} from "./_types";
import { QueryServiceClient } from "./gen/proto/chalk/engine/v1/query_server";
import { ChannelCredentials } from "@grpc/grpc-js";
import { FeatherBodyType } from "./gen/proto/chalk/common/v1/online_query";
import { ChalkError } from "./_errors";
import { headersToMetadata, mapGRPCChalkError } from "./_grpc";
import { tableFromIPC } from "apache-arrow";

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
  additionalHeaders?: ChalkHttpHeaders;

  defaultTimeout?: number;

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

  /**
   * If true, uses
   *
   * Defaults to false, the legacy behavior of this client. This will change at the next major release.
   */
  useQueryServerFromCredentialExchange?: boolean;
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
  additionalHeaders?: ChalkHttpHeaders;
}

export class ChalkGRPCClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly queryClient: QueryServiceClient;
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

    this.queryClient = new QueryServiceClient(
      this.config.queryServer || this.config.apiServer,
      ChannelCredentials.createInsecure()
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

    const { engines, primary_environment } = await this.credentials.get();
    const envId = this.config.activeEnvironment || primary_environment;
    const engineForEnvironment = envId ? engines?.[envId] : null;
    return engineForEnvironment || this.config.apiServer;
  }

  async query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>> {
    return new Promise((resolve, reject) => {
      const response = this.queryClient.onlineQueryBulk(
        {
          inputsFeather: serializeSingleQueryInputFeather(request.inputs),
          outputs: request.outputs.map((output) => ({
            featureFqn: output as string,
          })),
          context: {
            // Passed via headers
            environment: "",
            // Passed via headers
            deploymentId: "",
            correlationId: request.correlationId,
            options: request.plannerOptions ?? {},
            queryContext: request.queryContext ?? {},
            queryName: request.queryName,
            requiredResolverTags: [],
            tags: request.scopeTags ?? [],
            valueMetricsTagByFeatures: [],
          },
          responseOptions: {
            encodingOptions:
              typeof request.encodingOptions?.encodeStructsAsObjects ===
              "boolean"
                ? {
                    encodeStructsAsObjects:
                      request.encodingOptions.encodeStructsAsObjects,
                  }
                : undefined,
            includeMeta: !!request.include_meta,
            metadata: request.queryMeta ?? {},
            // TODO Add option before merge
            explain: false,
          },
          now: [new Date(request.now || "")],
          staleness: (request.staleness as Record<string, string>) ?? {},
          bodyType: FeatherBodyType.FEATHER_BODY_TYPE_TABLE,
        },
        headersToMetadata(this.getHeaders(requestOptions)),
        (error, response) => {
          if (error != null) {
            console.error(`[Chalk] ${error}`);
            reject(
              new ChalkError(error.name, {
                httpStatus: error.code,
                httpStatusText: error.message,
              })
            );
          }

          const responseObject: ChalkOnlineQueryResponse<TFeatureMap, TOutput> =
            {
              data: tableFromIPC(response.scalarsData).toArray()[0] as any,
              errors: response.errors.map(mapGRPCChalkError),
            };

          resolve(responseObject);
        }
      );
    });
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
