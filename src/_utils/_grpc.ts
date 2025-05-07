import {
  ChalkError as GRPCChalkError,
  ErrorCode as GRPCErrorCode,
  ErrorCodeCategory as GRPCErrorCodeCategory,
  ErrorCodeCategory,
} from "../gen/proto/chalk/common/v1/chalk_error.pb";
import {
  ChalkErrorCategory,
  ChalkErrorCode,
  ChalkErrorData,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineMultiQueryRequest,
} from "../_interface";
import { ChalkHttpHeaders } from "../_interface/_header";
import { Metadata } from "@grpc/grpc-js";
import { serializeBulkQueryInputFeather } from "../_feather";
import {
  FeatherBodyType,
  GenericSingleQuery,
  OnlineQueryBulkRequest,
  OnlineQueryMultiRequest,
} from "../gen/proto/chalk/common/v1/online_query.pb";

export const mapErrorCodeGRPCToSDK = (error: GRPCErrorCode): ChalkErrorCode => {
  switch (error) {
    case GRPCErrorCode.ERROR_CODE_CANCELLED:
      return "CANCELLED";
    case GRPCErrorCode.ERROR_CODE_DEADLINE_EXCEEDED:
      return "DEADLINE_EXCEEDED";
    case GRPCErrorCode.ERROR_CODE_INVALID_QUERY:
      return "INVALID_QUERY";
    case GRPCErrorCode.ERROR_CODE_PARSE_FAILED:
      return "PARSE_FAILED";
    case GRPCErrorCode.ERROR_CODE_RESOLVER_FAILED:
      return "RESOLVER_FAILED";
    case GRPCErrorCode.ERROR_CODE_RESOLVER_NOT_FOUND:
      return "RESOLVER_NOT_FOUND";
    case GRPCErrorCode.ERROR_CODE_RESOLVER_TIMED_OUT:
      return "RESOLVER_TIMED_OUT";
    case GRPCErrorCode.ERROR_CODE_UNAUTHENTICATED:
      return "UNAUTHENTICATED";
    case GRPCErrorCode.ERROR_CODE_UNAUTHORIZED:
      return "UNAUTHORIZED";
    case GRPCErrorCode.ERROR_CODE_UPSTREAM_FAILED:
      return "UPSTREAM_FAILED";
    case GRPCErrorCode.ERROR_CODE_VALIDATION_FAILED:
      return "VALIDATION_FAILED";
    case GRPCErrorCode.ERROR_CODE_INTERNAL_SERVER_ERROR_UNSPECIFIED:
    default:
      return "INTERNAL_SERVER_ERROR";
  }
};

export const mapErrorCategoryGRPCToSDK = (
  category: GRPCErrorCodeCategory
): ChalkErrorCategory => {
  switch (category) {
    case ErrorCodeCategory.ERROR_CODE_CATEGORY_FIELD:
      return "FIELD";
    case ErrorCodeCategory.ERROR_CODE_CATEGORY_REQUEST:
      return "REQUEST";
    case ErrorCodeCategory.ERROR_CODE_CATEGORY_NETWORK_UNSPECIFIED:
    default:
      return "NETWORK";
  }
};

export const mapGRPCChalkError = (error: GRPCChalkError): ChalkErrorData => {
  const chalkError: ChalkErrorData = {
    code: mapErrorCodeGRPCToSDK(error.code),
    category: mapErrorCategoryGRPCToSDK(error.category),
    message: error.message,

    feature: error.feature,
    resolver: error.resolver,
  };

  const maybeException = error.exception;
  if (maybeException != null) {
    // The exception that caused the failure, if applicable.
    chalkError.exception = {
      kind: maybeException.kind,
      message: maybeException.message,
      stacktrace: maybeException.stacktrace,
    };
  }

  return chalkError;
};

export const mapOnlineBulkQueryRequestChalkToGRPC = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>
): OnlineQueryBulkRequest => {
  return {
    inputsFeather: serializeBulkQueryInputFeather(request.inputs),
    outputs: request.outputs.map((output) => ({
      featureFqn: output as string,
    })),
    context: {
      // Passed via headers
      environment: "",
      // Passed via headers
      deploymentId: "",
      correlationId: request.correlationId,
      options: request.plannerOptions ?? {},
      queryContext: request.queryContext ?? {},
      queryName: request.queryName,
      requiredResolverTags: [],
      tags: request.scopeTags ?? [],
      valueMetricsTagByFeatures: [],
    },
    responseOptions: {
      encodingOptions:
        typeof request.encodingOptions?.encodeStructsAsObjects === "boolean"
          ? {
              encodeStructsAsObjects:
                request.encodingOptions.encodeStructsAsObjects,
            }
          : undefined,
      includeMeta: !!request,
      metadata: request.queryMeta ?? {},
      // TODO Add option before merge
      explain: true,
    },
    now: [request.now ? new Date(request.now) : new Date()],
    staleness: (request.staleness as Record<string, string>) ?? {},
    bodyType: FeatherBodyType.FEATHER_BODY_TYPE_TABLE,
  };
};

export const mapOnlineMultiQueryRequestChalkToGRPC = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  request: ChalkOnlineMultiQueryRequest<TFeatureMap, TOutput>
): OnlineQueryMultiRequest => {
  const { queries, ...rest } = request;
  const grpcQueries = queries.map((singleQuery): GenericSingleQuery => {
    const bulkRequest = mapOnlineBulkQueryRequestChalkToGRPC<
      TFeatureMap,
      TOutput
    >({
      ...rest,
      ...singleQuery,
    });

    return {
      bulkRequest,
    };
  });

  return {
    queries: grpcQueries,
  };
};

export const stripProtocol = (url: string): string => {
  const urlObj = new URL(url);
  return urlObj.host;
};

export const headersToMetadata = (headers: ChalkHttpHeaders): Metadata => {
  const metadata = new Metadata();
  for (const header in headers) {
    const headerValue = headers[header];
    metadata.set(header, `${headerValue}`);
  }

  return metadata;
};
