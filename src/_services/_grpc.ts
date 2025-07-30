import { ChalkHttpHeaders } from "../_interface/_header";
import {
  ChannelCredentials,
  ClientOptions as GRPCClientOptions,
  ClientUnaryCall,
  Metadata,
  ServiceError,
  Status,
} from "@grpc/grpc-js";
import { ChalkError } from "../_errors";
import { CredentialsHolder } from "./_credentials";
import { QueryServiceClient } from "../gen/proto/chalk/engine/v1/query_server.pb";
import {
  formUrlForGRPC,
  headersToMetadata,
  shouldUseInsecureChannel,
} from "../_utils/_grpc";
import {
  OnlineQueryBulkRequest,
  OnlineQueryBulkResponse,
  OnlineQueryMultiRequest,
  OnlineQueryMultiResponse,
} from "../gen/proto/chalk/common/v1/online_query.pb";
import { USER_AGENT } from "../_user_agent";
import { ChalkRequestOptions } from "../_interface/_request";

// Type for what the underlying grpc generated call expects
export type GRPCCall<Req, Resp> = (
  req: Req,
  metadata: Metadata,
  // Callback hell to be fixed by this service
  callback: (error: ServiceError | null, resp: Resp) => void
) => ClientUnaryCall;

// Function argument signature for what people calling this service should adhere to
export type GRPCCallArgs<Req> = [
  req: Req,
  metadata: Metadata,
  options: ChalkRequestOptions | null | undefined
];

// The API that this service provides
export type PromisifiedGRPCCall<Req, Resp> = (
  ...args: GRPCCallArgs<Req>
) => Promise<Resp>;

export interface ChalkGRRPCServiceArgs {
  defaultTimeout?: number;
  additionalHeaders?: ChalkHttpHeaders;
  endpoint: string;
  clientOptions?: Partial<GRPCClientOptions>;
  credentialsHolder: CredentialsHolder;
}

export class ChalkGRPCService {
  private defaultTimeout: number | undefined;
  private additionalHeaders: ChalkHttpHeaders | undefined;
  private credentialsHolder: CredentialsHolder;
  private queryClient: QueryServiceClient;

  constructor({
    defaultTimeout,
    additionalHeaders,
    clientOptions,
    credentialsHolder,
    endpoint,
  }: ChalkGRRPCServiceArgs) {
    this.defaultTimeout = defaultTimeout;
    this.additionalHeaders = additionalHeaders;
    this.credentialsHolder = credentialsHolder;
    this.queryClient = this.queryClient = new QueryServiceClient(
      formUrlForGRPC(endpoint),
      shouldUseInsecureChannel(endpoint)
        ? ChannelCredentials.createInsecure()
        : ChannelCredentials.createSsl(),
      {
        ...clientOptions,
        "grpc.enable_retries": clientOptions?.["grpc.enable_retries"] ?? 3,
      }
    );
  }

  private promisfyGRPCCall = <Req, Resp>(
    call: GRPCCall<Req, Resp>
  ): PromisifiedGRPCCall<Req, Resp> => {
    return async (
      req: Req,
      metadata: Metadata,
      opts: ChalkRequestOptions | null | undefined
    ): Promise<Resp> => {
      const makeCall = async (): Promise<Resp> => {
        const credentials = await this.credentialsHolder.get();

        const fullMetadata = headersToMetadata({
          "X-Chalk-Deployment-Type": "engine-grpc",
          "User-Agent": USER_AGENT,
          Authorization: `Bearer ${credentials.access_token}`,
          ...this.additionalHeaders,
        });

        const timeoutToUse = opts?.timeout ?? this.defaultTimeout;

        if (timeoutToUse != null) {
          fullMetadata.set("X-Chalk-Timeout", timeoutToUse.toString());
        }

        fullMetadata.merge(metadata);

        return new Promise<Resp>((resolve, reject) => {
          call(req, fullMetadata, (error: ServiceError | null, resp: Resp) => {
            if (error != null) {
              console.error(`[Chalk] ${error}`);
              return reject(
                new ChalkError(error.name, {
                  httpStatus: error.code,
                  httpStatusText: error.message,
                })
              );
            }

            resolve(resp);
          });
        });
      };

      try {
        return await makeCall();
      } catch (e) {
        // Retry on UNAUTHENTICATED (similar to HTTP 401)
        if (
          e instanceof ChalkError &&
          e.httpStatus === Status.UNAUTHENTICATED
        ) {
          this.credentialsHolder.clear();
          return makeCall();
        }
        throw e;
      }
    };
  };

  public queryBulk = (
    ...args: GRPCCallArgs<OnlineQueryBulkRequest>
  ): Promise<OnlineQueryBulkResponse> => {
    return this.promisfyGRPCCall<
      OnlineQueryBulkRequest,
      OnlineQueryBulkResponse
    >((...callArgs) => this.queryClient.onlineQueryBulk(...callArgs))(...args);
  };

  public queryMulti = (
    ...args: GRPCCallArgs<OnlineQueryMultiRequest>
  ): Promise<OnlineQueryMultiResponse> => {
    return this.promisfyGRPCCall<
      OnlineQueryMultiRequest,
      OnlineQueryMultiResponse
    >((...callArgs) => this.queryClient.onlineQueryMulti(...callArgs))(...args);
  };
}
