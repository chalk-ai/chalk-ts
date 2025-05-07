import { ChalkHttpHeaders } from "../_interface/_header";
import {
  ChannelCredentials,
  ClientUnaryCall,
  Metadata,
  ServiceError,
} from "@grpc/grpc-js";
import { ChalkError } from "../_errors";
import { CredentialsHolder } from "./_credentials";
import { QueryServiceClient } from "../gen/proto/chalk/engine/v1/query_server.pb";
import { headersToMetadata, stripProtocol } from "../_utils/_grpc";
import {
  OnlineQueryBulkRequest,
  OnlineQueryBulkResponse,
  OnlineQueryMultiRequest,
  OnlineQueryMultiResponse,
} from "../gen/proto/chalk/common/v1/online_query.pb";
import { USER_AGENT } from "../_user_agent";
import { ChalkRequestOptions } from "../_interface/_request";

export type GRPCCall<Req, Resp> = (
  req: Req,
  metadata: Metadata,
  callback: (error: ServiceError | null, resp: Resp) => void
) => ClientUnaryCall;

export type GRPCCallArgs<Req> = [
  req: Req,
  metadata: Metadata,
  ChalkRequestOptions | null | undefined
];

export type PromisifiedGRPCCall<Req, Resp> = (
  ...args: GRPCCallArgs<Req>
) => Promise<Resp>;

export interface ChalkGRRPCServiceArgs {
  defaultTimeout?: number;
  additionalHeaders?: ChalkHttpHeaders;
  endpoint: string;
  maxNetworkRetries?: number;
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
    maxNetworkRetries,
    credentialsHolder,
    endpoint,
  }: ChalkGRRPCServiceArgs) {
    this.defaultTimeout = defaultTimeout;
    this.additionalHeaders = additionalHeaders;
    this.credentialsHolder = credentialsHolder;
    this.queryClient = this.queryClient = new QueryServiceClient(
      stripProtocol(endpoint),
      ChannelCredentials.createInsecure(),
      { "grpc.enable_retries": maxNetworkRetries }
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
      const credentials = await this.credentialsHolder.get();

      const fullMetadata = headersToMetadata({
        "X-Chalk-Deployment-Type": "engine-grpc",
        "Content-Type": "application/json;charset=utf-8",
        "User-Agent": USER_AGENT,
        Accept: "application/octet-stream",
        Authorization: `Bearer ${credentials.access_token}`,
        ...this.additionalHeaders,
      });

      const timeoutToUse = opts?.timeout ?? this.defaultTimeout;

      if (timeoutToUse != null) {
        fullMetadata.set("X-Chalk-Timeout", timeoutToUse.toString());
      }

      fullMetadata.merge(metadata);

      return new Promise<Resp>((resolve, reject) => {
        call(req, metadata, (error: ServiceError | null, resp: Resp) => {
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
  };

  public queryBulk = (
    ...args: GRPCCallArgs<OnlineQueryBulkRequest>
  ): Promise<OnlineQueryBulkResponse> => {
    return this.promisfyGRPCCall<
      OnlineQueryBulkRequest,
      OnlineQueryBulkResponse
    >(this.queryClient.onlineQueryBulk)(...args);
  };

  public queryMulti = (
    ...args: GRPCCallArgs<OnlineQueryMultiRequest>
  ): Promise<OnlineQueryMultiResponse> => {
    return this.promisfyGRPCCall<
      OnlineQueryMultiRequest,
      OnlineQueryMultiResponse
    >(this.queryClient.onlineQueryMulti)(...args);
  };
}
