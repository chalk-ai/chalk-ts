import { ChalkScalar } from "./_types";

export interface ChalkGetRunStatusResponse {
  id: string;
  status: ChalkResolverRunStatus;
}

export enum TimestampFormat {
  EPOCH_MILLIS = "EPOCH_MILLIS",
  ISO_8601 = "ISO_8601",
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
}

export type ChalkOnlineQueryResponseStatusKind =
  | "success"
  | "partial_success"
  | "error";

export type ChalkErrorCode =
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

export interface ChalkErrorData {
  // The type of the error.
  code: ChalkErrorCode;

  // The category of the error, given in the type field for the error codes.
  category: ChalkErrorCategory;

  // A readable description of the error message.
  message: string;

  // The exception that caused the failure, if applicable.
  exception?: {
    // The type of the exception.
    kind: string;

    // A readable description of the exception.
    message: string;

    // The stacktrace of the exception.
    stacktrace: string;
  };

  // The fully qualified name of the failing feature, e.g. `user.identity.has_voip_phone`.
  feature?: string;

  // The fully qualified name of the failing resolver, e.g. `my.project.get_fraud_score`.
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
  // The output features and any query metadata.
  data: {
    [K in TOutput]: {
      // The value of the requested feature.
      // If an error was encountered in resolving this feature,
      // this field will be empty.
      value: TFeatureMap[K];

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
    };
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
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };
  scopeTags?: string[];
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

export interface ChalkClientInterface<
  TFeatureMap = Record<string, ChalkScalar>
> {
  /**
   * Retrieves the status of a resolver run.
   * See https://docs.chalk.ai/docs/runs for more information.
   * @param runId - The run ID of the resolver run.
   */
  getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse>;

  /**
   * Compute features values using online resolvers.
   * See https://docs.chalk.ai/docs/query-basics for more information.
   * @param request - The request to compute feature values, containing the features to compute.
   */
  query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>>;

  /**
   * Compute features values for many rows of inputs using online resolvers.
   * See https://docs.chalk.ai/docs/query-basics for more information on online query.
   * This method is similar to `query`, except it takes in `list` of inputs, and produces one
   * output per row of inputs.
   * This method is appropriate if you want to fetch the same set of features for many different
   * input primary keys.
   * This method contrasts with `multi_query`, which executes multiple fully independent queries.
   * This endpoint is not available in all environments.
   * @param request - The request to compute feature values, containing the features to compute.
   */
  queryBulk<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>>;

  /**
   * Execute multiple queries (represented by `queries` argument) in a single request. This is useful if the
   * queries are "rooted" in different `@features` classes -- i.e. if you want to load features for `User` and
   * `Merchant` and there is no natural relationship object which is related to both of these classes, `multi_query`
   * allows you to submit two independent queries.
   *
   * In contrast, `query_bulk` executes a single query with multiple inputs/outputs.
   */
  multiQuery<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineMultiQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineMultiQueryResponse<TFeatureMap, TOutput>>;

  /**
   * Upload data to Chalk for use in offline resolvers or to prime a cache.
   * @param request - The request to upload data, containing the features to upload.
   */
  uploadSingle(request: ChalkUploadSingleRequest<TFeatureMap>): Promise<void>;

  /**
   * Triggers a resolver to run.
   * See https://docs.chalk.ai/docs/runs for more information.
   * @param request - The request to trigger a resolver run, containing the resolver FQN and optional deployment ID.
   * @returns - The run ID of the triggered resolver run.
   */
  triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse>;

  /**
   * Checks the identity of your client.
   *
   * Useful as a sanity test of your configuration.
   */
  whoami(): Promise<ChalkWhoamiResponse>;
}
