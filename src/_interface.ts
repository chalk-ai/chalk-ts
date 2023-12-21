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

  queryMeta?: {
    [key: string]: string;
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
}

export type ChalkOnlineQueryResponseStatusKind =
  | "success"
  | "partial_success"
  | "error";

export type ErrorCode =
  // The query contained features that do not exist.
  | "PARSE_FAILED"
  // A resolver was required as part of running the dependency graph that could not be found.
  | "RESOLVER_NOT_FOUND"
  // The query is invalid. All supplied features need to be rooted in the same top-level entity.
  | "INVALID_QUERY"
  // A feature value did not match the expected schema (e.g. `incompatible type "int"; expected "str"`)
  | "VALIDATION_FAILED"
  // The resolver for a feature errored.
  | "RESOLVER_FAILED"
  // The resolver for a feature timed out.
  | "RESOLVER_TIMED_OUT"
  // A crash in a resolver that was to produce an input for the resolver crashed,
  // and so the resolver could not run crashed, and so the resolver could not run.
  | "UPSTREAM_FAILED"
  // The request was submitted with an invalid authentication header.
  | "UNAUTHENTICATED"
  // The supplied credentials do not provide the right authorization to execute the request.
  | "UNAUTHORIZED"
  // An unspecified error occurred.
  | "INTERNAL_SERVER_ERROR"
  // The operation was cancelled, typically by the caller.
  | "CANCELLED"
  // The deadline expired before the operation could complete.
  | "DEADLINE_EXCEEDED";

export type ChalkErrorCategory =
  // Request errors are raised before execution of your
  // resolver code. They may occur due to invalid feature
  // names in the input or a request that cannot be satisfied
  // by the resolvers you have defined.
  | "REQUEST"
  // Field errors are raised while running a feature resolver
  // for a particular field. For this type of error, you'll
  // find a feature and resolver attribute in the error type.
  // When a feature resolver crashes, you will receive null
  // value in the response. To differentiate from a resolver
  // returning a null value and a failure in the resolver,
  // you need to check the error schema.
  | "FIELD"
  // Network errors are thrown outside your resolvers.
  // For example, your request was unauthenticated,
  // connection failed, or an error occurred within Chalk.
  | "NETWORK";

export interface ChalkError {
  code: ErrorCode;
  category: ChalkErrorCategory;
  message: string;
  exception?: {
    kind: string;
    message: string;
    stacktrace: string;
  };
  feature?: string;
  resolver?: string;
}

export interface ChalkFeatureMeta {
  // The fully qualified name of the resolver that computed this feature.
  chosenResolverFqn?: string;

  // Whether this feature was computed from the cache.
  cacheHit?: boolean;

  // The primitive type of this feature.
  primitiveType?: string;

  version?: number;
}

export interface ChalkOnlineQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  data: {
    [K in TOutput]: {
      value: TFeatureMap[K];
      computedAt?: Date;
      error?: ChalkError;

      // Only included if `include_meta` is true.
      meta?: ChalkFeatureMeta;
    };
  };

  // If there are no errors, `errors` will be undefined.
  errors?: ChalkError[];

  // Only included if `include_meta` is true.
  meta?: ChalkQueryMeta;
}

export interface ChalkOnlineBulkQueryRequest<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  inputs: Partial<{ [K in keyof TFeatureMap]: TFeatureMap[K][] }>;
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
  encodingOptions?: {
    encodeStructsAsObjects?: boolean;
  };

  // `now` should be an ISO-formatted "zoned datetime" or "instant" string.
  now?: string;
}

export interface ChalkOnlineBulkQueryResponse<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  data: {
    [K in TOutput]: TFeatureMap[K];
  }[];
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
}
