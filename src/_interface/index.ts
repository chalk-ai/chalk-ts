import { ChalkError } from "../_errors";

export type {
  ChalkClientGRPCInterface,
  ChalkClientHTTPInterface,
  ChalkClientInterface,
  ChalkClientConfig,
} from "./_client";
export { TimestampFormat } from "./_client";
import type {
  ChalkErrorData,
  ChalkErrorCode,
  ChalkErrorCategory,
} from "./_error";

export type { ChalkErrorData, ChalkErrorCode, ChalkErrorCategory };

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

export interface ChalkOnlineBulkQueryRequestSimple<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  inputs: Partial<{ [K in keyof TFeatureMap]: TFeatureMap[K][] }>;
  outputs: TOutput[];
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };
  scopeTags?: string[];
}

export interface ChalkOnlineQueryRequest<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  // The features for which there are known values, mapped to those values.
  // For example, `{'user.id': 1234}`.
  inputs: Partial<TFeatureMap>;

  // Outputs are the features that you'd like to compute from the inputs.
  // For example, `['user.age', 'user.name', 'user.email']`.
  outputs: TOutput[];

  // Maximum staleness overrides for any output features or intermediate features.
  // See https://docs.chalk.ai/docs/query-caching for more information.
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };

  // If true, will populate an explain output that includes performance and operations metadata.
  explain?: boolean;

  scopeTags?: string[];

  // If specified, Chalk will route your request to the relevant preview deployment.
  previewDeploymentId?: string;

  // You can specify a correlation ID to be used in logs and web interfaces.
  // This should be globally unique, i.e. a `uuid` or similar. Logs generated
  // during the execution of your query will be tagged with this correlation id.
  correlationId?: string;

  // The semantic name for the query you're making, for example, `"loan_application_model"`.
  // Typically, each query that you make from your application should have a name.
  // Chalk will present metrics and dashboard functionality grouped by 'query_name'.
  queryName?: string;

  // The version for the named query that you're running.
  queryNameVersion?: string;

  queryMeta?: {
    [key: string]: string;
  };

  // Optional context parameters that will be passed with the query
  queryContext?: {
    [key: string]: string | number | boolean;
  };

  encodingOptions?: {
    encodeStructsAsObjects?: boolean;
  };

  // `now` should be an ISO-formatted "zoned datetime" or "instant" string.
  // The time at which to evaluate the query. If not specified, the current time will be used.
  // This parameter is complex in the context of online_query since the online store
  // only stores the most recent value of an entity's features. If `now` is in the past,
  // it is extremely likely that `None` will be returned for cache-only features.
  //
  // This parameter is primarily provided to support:
  // - controlling the time window for aggregations over cached has-many relationships
  // - controlling the time wnidow for aggregations over has-many relationships loaded from an
  // external database
  //
  // If you are trying to perform an exploratory analysis of past feature values, prefer `offline_query`.
  now?: string;

  include_meta?: boolean;

  // Set additional options to be considered by the Chalk query planner; typically
  // provided by Chalk support for advanced use cases or beta functionality.
  plannerOptions?: { [index: string]: string | boolean | number };
}

export interface ChalkQueryMeta {
  // The time, expressed in seconds, that Chalk spent executing this query.
  executionDurationS: number;

  // The id of the deployment that served this query.
  deploymentId?: string;

  // The id of the environment that served this query. Not intended to be human readable, but helpful for support.
  environmentId?: string;

  // The short name of the environment that served this query. For example: "dev" or "prod".
  environmentName?: string;

  // A unique ID generated and persisted by Chalk for this query. All computed features, metrics, and logs are
  // associated with this ID. Your system can store this ID for audit and debugging workflows.
  queryId?: string;

  // At the start of query execution, Chalk computes 'datetime.now()'. This value is used to timestamp computed features.
  queryTimestamp?: string;

  // Deterministic hash of the 'structure' of the query. Queries that have the same input/output features will
  // typically have the same hash; changes may be observed over time as we adjust implementation details.
  queryHash?: string;

  // An unstructured string containing diagnostic information about the query execution. Only included if `explain` is True.
  explainOutput?: string;

  // Additional, experimental metadata for debugging query performance.
  additionalMetadata?: Record<string, string>;
}

export type ChalkOnlineQueryResponseStatusKind =
  | "success"
  | "partial_success"
  | "error";

export interface ChalkFeatureMeta {
  // The fully qualified name of the resolver that computed this feature.
  chosenResolverFqn?: string;

  // Whether this feature was computed from the cache.
  cacheHit?: boolean;

  // The primitive type of this feature.
  primitiveType?: string;

  version?: number;
}

export interface ChalkOnlineQueryFeatureResult<
  TFeatureMap,
  Key extends keyof TFeatureMap
> {
  // The value of the requested feature.
  // If an error was encountered in resolving this feature,
  // this field will be empty.
  value: TFeatureMap[Key];

  // The time at which this feature was computed.
  // This value could be significantly in the past if you're using caching.
  computedAt?: Date;

  // The error code encountered in resolving this feature.
  // If no error occurred, this field is empty.
  error?: ChalkErrorData;

  // If an error occurred resolving this feature, this field will be 'false'.
  valid?: boolean;

  // Only included if `include_meta` is true.
  meta?: ChalkFeatureMeta;
}

export interface ChalkOnlineQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  // The output features and any query metadata.
  data: {
    [K in TOutput]: ChalkOnlineQueryFeatureResult<TFeatureMap, K>;
  };

  // Errors encountered while running the resolvers.
  // If there are no errors, `errors` will be undefined.
  errors?: ChalkErrorData[];

  // Only included if `include_meta` is true.
  meta?: ChalkQueryMeta;
}

export interface ChalkOnlineMultiQueryRequest<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  queries: Array<ChalkOnlineBulkQueryRequestSimple<TFeatureMap, TOutput>>;
  previewDeploymentId?: string;
  correlationId?: string;
  queryName?: string;
  queryNameVersion?: string;
  queryMeta?: {
    [key: string]: string;
  };
  // Optional context parameters that will be passed with the query
  queryContext?: {
    [key: string]: string | number | boolean;
  };
  encodingOptions?: {
    encodeStructsAsObjects?: boolean;
  };
  plannerOptions?: { [key: string]: string | number | boolean };
}

export interface ChalkOnlineMultiQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  responses: Array<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>>;
}

export interface ChalkOnlineBulkQueryRequest<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  inputs: Partial<{ [K in keyof TFeatureMap]: TFeatureMap[K][] }>;
  outputs: TOutput[];
  explain?: boolean;
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };
  scopeTags?: string[];
  previewDeploymentId?: string;
  correlationId?: string;
  include_meta?: boolean;
  queryName?: string;
  queryNameVersion?: string;
  queryMeta?: {
    [key: string]: string;
  };

  // Optional context parameters that will be passed with the query
  queryContext?: {
    [key: string]: string | number | boolean;
  };

  encodingOptions?: {
    encodeStructsAsObjects?: boolean;
  };

  // `now` should be an ISO-formatted "zoned datetime" or "instant" string.
  now?: string;
  // Set additional options to be considered by the Chalk query planner; typically
  // provided by Chalk support for advanced use cases or beta functionality.
  plannerOptions?: { [index: string]: string | boolean | number };
}

export interface ChalkOnlineBulkQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  data: {
    [K in TOutput]: TFeatureMap[K];
  }[];
  meta?: ChalkQueryMeta;
  errors?: ChalkErrorData[];
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
  // The id of the user.
  user: string;
}

export interface ChalkPingQueryServerResponse {
  success?: boolean;
  error?: ChalkError;
}
