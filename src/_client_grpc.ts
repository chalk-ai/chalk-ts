import { ChalkHTTPService } from "./_services/_http";
import { ChalkHttpHeaders, ChalkHttpHeadersStrict } from "./_interface/_header";
import { CredentialsHolder } from "./_services/_credentials";
import {
  ChalkClientConfig,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineMultiQueryResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  ChalkPingQueryServerResponse,
} from "./_interface";
import { ChalkScalar } from "./_interface/_types";
import {
  headersToMetadata,
  mapBulkQueryResponseGrpcToChalk,
  mapBulkQueryResponseGrpcToChalkOnlineResponse,
  mapOnlineBulkQueryRequestChalkToGRPC,
  mapOnlineMultiQueryRequestChalkToGRPC,
} from "./_utils/_grpc";
import { ChalkGRPCClientOpts } from "./_interface/_options";
import { onlineSingleRequestToBulkRequest } from "./_request";
import { ChalkGRPCService } from "./_services/_grpc";
import { ChalkRequestOptions } from "./_interface/_request";
import { configFromOptionsAndEnvironment } from "./_utils/_config";
import { ChalkError } from "./_errors";
import { ChalkClientGRPCInterface } from "./_interface";

export class ChalkGRPCClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientGRPCInterface<TFeatureMap>
{
  private readonly config: ChalkClientConfig;
  private readonly http: ChalkHTTPService;
  private readonly credentials: CredentialsHolder;
  // initialized lazily
  private queryService: Promise<ChalkGRPCService>;
  constructor(opts?: ChalkGRPCClientOpts) {
    this.config = {
      ...configFromOptionsAndEnvironment(opts),
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
      clientOptions: opts?.grpcClientOptions,
    });
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

    const environmentId = await this.getActiveEnvironment();

    const engineFromCredentials =
      await this.credentials.getEngineUrlFromCredentials(environmentId);

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

    return mapBulkQueryResponseGrpcToChalkOnlineResponse(response, this.config);
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

    return {
      responses: response.responses
        .map((singleResponse, idx) => {
          return singleResponse.bulkResponse
            ? mapBulkQueryResponseGrpcToChalk(
                singleResponse.bulkResponse,
                this.config
              )
            : null;
        })
        .filter(
          (
            response
          ): response is ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput> =>
            response != null
        ),
    };
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

    return mapBulkQueryResponseGrpcToChalk(response, this.config);
  }

  async pingQueryServer(
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkPingQueryServerResponse> {
    const queryService = await this.queryService;
    const headers = await this.getHeaders();
    const now = Math.floor(new Date().valueOf() / 1000);

    try {
      const response = await queryService.pingQueryServer(
        { num: now },
        headersToMetadata(headers),
        requestOptions
      );

      if (response.num !== now) {
        return {
          success: false,
          error: new ChalkError(
            `Expected value from ping to match request ${now} but got ${response.num}`
          ),
        };
      }

      return {
        success: true,
      };
    } catch (err) {
      if (err instanceof ChalkError) {
        return {
          success: false,
          error: err,
        };
      } else if (err instanceof Error) {
        return {
          success: false,
          error: new ChalkError(`Internal SDK Error: ${err.message}`),
        };
      }

      return {
        success: false,
        error: new ChalkError(
          "An unknown error occurred while pinging the query server."
        ),
      };
    }
  }

  private async getHeaders(
    requestOptions?: ChalkRequestOptions
  ): Promise<ChalkHttpHeaders> {
    const headers: ChalkHttpHeadersStrict = {};

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
