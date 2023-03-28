import { ChalkScalar } from "./_types";

export interface ChalkGetRunStatusResponse {
  id: string;
  status: ChalkResolverRunStatus;
}

export interface ChalkUploadSingleRequest<TFeatureMap> {
  features: Partial<TFeatureMap>;
  previewDeploymentId?: string;
  correlationId?: string;
  scopeTags?: string[];
}

export interface ChalkOnlineQueryRequest<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  inputs: Partial<TFeatureMap>;
  outputs: TOutput[];
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };
  scopeTags?: string[];
  previewDeploymentId?: string;
  correlationId?: string;
  queryName?: string;
  queryMeta?: {
    [key: string]: string;
  };
}

export type ChalkOnlineQueryResponseStatusKind =
  | "success"
  | "partial_success"
  | "error";

export interface ChalkOnlineQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  data: {
    [K in TOutput]: {
      value: TFeatureMap[K];
      computedAt: Date;
    };
  };
}

export type ChalkResolverRunStatus = "received" | "succeeded" | "failed";

export interface ChalkTriggerResolverRunRequest {
  resolverFqn: string;
  deploymentId?: string;
}

export interface ChalkTriggerResolverRunResponse {
  id: string;
  status: ChalkResolverRunStatus;
}

export interface ChalkWhoamiResponse {
  user: string;
}

export interface ChalkClientInterface<
  TFeatureMap = Record<string, ChalkScalar>
> {
  getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse>;

  query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>>;

  uploadSingle(request: ChalkUploadSingleRequest<TFeatureMap>): Promise<void>;

  triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse>;

  whoami(): Promise<ChalkWhoamiResponse>;

  /**
   * Flush any tracing spans that have not been exported.
   */
  flushTraces(): Promise<void>;
}
