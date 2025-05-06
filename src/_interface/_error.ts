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
