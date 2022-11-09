export interface ChalkGetRunStatusResponse {
  id: string;
  status: ChalkResolverRunStatus;
}

export interface ChalkOnlineQueryRequest<
  TFeatureMap extends AnyFeatureMap,
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
  TFeatureMap extends AnyFeatureMap,
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

type _ChalkScalar = string | number | boolean;
interface AnyFeatureMap {
  [fqn: string]: _ChalkScalar;
}

export interface ChalkClientInterface<
  TFeatureMap extends AnyFeatureMap = AnyFeatureMap
> {
  getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse>;

  query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>>;

  triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse>;

  whoami(): Promise<ChalkWhoamiResponse>;
}
