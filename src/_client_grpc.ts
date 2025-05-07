import { DEFAULT_API_SERVER } from "./_const";
import { ChalkHTTPService } from "./_services/_http";
import { ChalkHttpHeaders, ChalkHttpHeadersStrict } from "./_interface/_header";
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
import {
  headersToMetadata,
  mapGRPCChalkError,
  mapOnlineBulkQueryRequestChalkToGRPC,
  mapOnlineMultiQueryRequestChalkToGRPC,
} from "./_utils/_grpc";
import { tableFromIPC } from "apache-arrow";
import { ChalkGRPCClientOpts } from "./_interface/_options";
import { onlineSingleRequestToBulkRequest } from "./_request";
import { ChalkGRPCService } from "./_services/_grpc";
import { ChalkRequestOptions } from "./_interface/_request";

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

export class ChalkGRPCClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly credentials: CredentialsHolder;
  // initialized lazily
  private queryService: Promise<ChalkGRPCService>;
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

    this.queryService = this.getQueryService(opts);
  }

  async getQueryService(opts?: ChalkGRPCClientOpts): Promise<ChalkGRPCService> {
    const queryEndpoint = await this.getQueryServer();
    return new ChalkGRPCService({
      additionalHeaders: opts?.additionalHeaders,
      endpoint: queryEndpoint,
      credentialsHolder: this.credentials,
    });
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
    const queryService = await this.queryService;
    const requestBody = mapOnlineBulkQueryRequestChalkToGRPC(
      onlineSingleRequestToBulkRequest(request)
    );
    const headers = await this.getHeaders(requestOptions);

    const response = await queryService.queryBulk(
      requestBody,
      headersToMetadata(headers),
      requestOptions
    );

    const responseObject: ChalkOnlineQueryResponse<TFeatureMap, TOutput> = {
      data: tableFromIPC(response.scalarsData).toArray()[0] as any,
      errors: response.errors.map(mapGRPCChalkError),
    };

    return responseObject;
  }

  async multiQuery<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineMultiQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineMultiQueryResponse<TFeatureMap, TOutput>> {
    const queryService = await this.queryService;
    const requestBody = mapOnlineMultiQueryRequestChalkToGRPC(request);
    const headers = await this.getHeaders(requestOptions);

    const response = await queryService.queryMulti(
      requestBody,
      headersToMetadata(headers),
      requestOptions
    );

    const responseObject: ChalkOnlineMultiQueryResponse<TFeatureMap, TOutput> =
      {
        responses: response.responses.map((singleResponse) => ({
          data: tableFromIPC(
            singleResponse.bulkResponse!.scalarsData
          ).toArray()[0] as any,
          errors: singleResponse.bulkResponse!.errors.map(mapGRPCChalkError),
        })),
      };

    return responseObject;
  }

  async queryBulk<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>,
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>> {
    const queryService = await this.queryService;
    const requestBody = mapOnlineBulkQueryRequestChalkToGRPC(request);
    const headers = await this.getHeaders(requestOptions);
    const response = await queryService.queryBulk(
      requestBody,
      headersToMetadata(headers),
      requestOptions
    );

    const responseObject: ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput> = {
      data: tableFromIPC(response.scalarsData).toArray()[0] as any,
      errors: response.errors.map(mapGRPCChalkError),
    };

    return responseObject;
  }

  private async getHeaders(
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkHttpHeaders> {
    const headers: ChalkHttpHeadersStrict = {};

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
