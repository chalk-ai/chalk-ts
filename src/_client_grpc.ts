import { DEFAULT_API_SERVER } from "./_const";
import { ChalkHttpHeaders, ChalkHTTPService } from "./_services/_http";
import { CredentialsHolder } from "./_services/_credentials";
import {
  ChalkClientInterface,
  ChalkClientConfig,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineMultiQueryResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  TimestampFormat,
} from "./_interface";
import { ChalkEnvironmentVariables, ChalkScalar } from "./_interface/_types";
import { QueryServiceClient } from "./gen/proto/chalk/engine/v1/query_server.pb";
import { ChannelCredentials } from "@grpc/grpc-js";
import { ChalkError } from "./_errors";
import {
  headersToMetadata,
  mapGRPCChalkError,
  mapOnlineBulkQueryRequestChalkToGRPC,
  mapOnlineMultiQueryRequestChalkToGRPC,
  stripProtocol,
} from "./_utils/_grpc";
import { tableFromIPC } from "apache-arrow";
import { USER_AGENT } from "./_user_agent";
import { ChalkGRPCClientOpts } from "./_interface/_options";
import { onlineSingleRequestToBulkRequest } from "./_request";

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
  private readonly credentials: CredentialsHolder;
  // initialized lazily
  private queryClient: QueryServiceClient | null = null;
  constructor(opts?: ChalkGRPCClientOpts) {
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
        !opts?.skipQueryServerFromCredentialExchange,
    };

    this.http = new ChalkHTTPService(
      opts?.fetch,
      opts?.fetchHeaders,
      opts?.defaultTimeout,
      opts?.additionalHeaders
    );

    this.credentials = new CredentialsHolder(this.config, this.http);
  }

  async getQueryClient(): Promise<QueryServiceClient> {
    if (this.queryClient == null) {
      const queryServer = await this.getQueryServer();
      this.queryClient = new QueryServiceClient(
        stripProtocol(queryServer),
        ChannelCredentials.createInsecure()
      );
    }

    return this.queryClient;
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

  async query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>> {
    const queryClient = await this.getQueryClient();
    const requestBody = mapOnlineBulkQueryRequestChalkToGRPC(
      onlineSingleRequestToBulkRequest(request)
    );
    const headers = await this.getHeaders(requestOptions);

    return new Promise((resolve, reject) => {
      queryClient.onlineQueryBulk(
        requestBody,
        headersToMetadata(headers),
        (error, response) => {
          if (error != null) {
            console.error(`[Chalk] ${error}`);
            return reject(
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
    const queryClient = await this.getQueryClient();
    const requestBody = mapOnlineMultiQueryRequestChalkToGRPC(request);
    const headers = await this.getHeaders(requestOptions);

    return new Promise((resolve, reject) => {
      queryClient.onlineQueryMulti(
        requestBody,
        headersToMetadata(headers),
        (error, response) => {
          if (error != null) {
            console.error(`[Chalk] ${error}`);
            return reject(
              new ChalkError(error.name, {
                httpStatus: error.code,
                httpStatusText: error.message,
              })
            );
          }

          const responseObject: ChalkOnlineMultiQueryResponse<
            TFeatureMap,
            TOutput
          > = {
            responses: response.responses.map((singleResponse) => ({
              data: tableFromIPC(
                singleResponse.bulkResponse!.scalarsData
              ).toArray()[0] as any,
              errors:
                singleResponse.bulkResponse!.errors.map(mapGRPCChalkError),
            })),
          };

          resolve(responseObject);
        }
      );
    });
  }

  async queryBulk<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>> {
    const queryClient = await this.getQueryClient();
    const requestBody = mapOnlineBulkQueryRequestChalkToGRPC(request);
    const headers = await this.getHeaders(requestOptions);

    return new Promise((resolve, reject) => {
      queryClient.onlineQueryBulk(
        requestBody,
        headersToMetadata(headers),
        (error, response) => {
          if (error != null) {
            console.error(`[Chalk] ${error}`);
            return reject(
              new ChalkError(error.name, {
                httpStatus: error.code,
                httpStatusText: error.message,
              })
            );
          }

          const responseObject: ChalkOnlineBulkQueryResponse<
            TFeatureMap,
            TOutput
          > = {
            data: tableFromIPC(response.scalarsData).toArray()[0] as any,
            errors: response.errors.map(mapGRPCChalkError),
          };

          resolve(responseObject);
        }
      );
    });
  }

  private async getHeaders(
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkHttpHeaders> {
    const credentials = await this.credentials?.get();
    const headers: ChalkHttpHeaders = {
      "X-Chalk-Deployment-Type": "engine-grpc",
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": USER_AGENT,
      Accept: "application/octet-stream",
      Authorization: `Bearer ${credentials.access_token}`,
    };

    if (this.config.activeEnvironment) {
      headers["X-Chalk-Env-Id"] = this.config.activeEnvironment;
    } else if (credentials.primary_environment != null) {
      headers["X-Chalk-Env-Id"] = credentials.primary_environment;
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
