import {
  ChalkError as GRPCChalkError,
  ErrorCode as GRPCErrorCode,
  ErrorCodeCategory as GRPCErrorCodeCategory,
  ErrorCodeCategory,
} from "../gen/proto/chalk/common/v1/chalk_error.pb";
import {
  ChalkClientConfig,
  ChalkErrorCategory,
  ChalkErrorCode,
  ChalkErrorData,
  ChalkFeatureMeta,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineQueryFeatureResult,
  ChalkOnlineQueryResponse,
  ChalkQueryMeta,
} from "../_interface";
import { ChalkHttpHeaders } from "../_interface/_header";
import { serializeBulkQueryInputFeather } from "./_feather";
import {
  FeatherBodyType,
  GenericSingleQuery,
  OnlineQueryBulkRequest,
  OnlineQueryBulkResponse,
  OnlineQueryMetadata,
  OnlineQueryMultiRequest,
} from "../gen/proto/chalk/common/v1/online_query.pb";
import { tableFromIPC } from "apache-arrow";
import { Metadata } from "@grpc/grpc-js";
import { processArrowTable } from "../_bulk_response";
import { unwrapArrowSpecificTypes } from "./_arrow";

/**  Request-Related **/

export const mapOnlineBulkQueryRequestChalkToGRPC = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>
): OnlineQueryBulkRequest => {
  const firstInput = Object.values(request.inputs)[0];
  const inputLength = Array.isArray(firstInput) ? firstInput.length : 0;
  const safeNow = request.now ? new Date(request.now) : new Date();
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
      options: {
        pack_groups_into_structs: true,
        // arrow JS implementation cannot handle large lists, must send option to allow parsing
        pack_groups_avoid_large_list: true,
        ...request.plannerOptions,
      },
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
      includeMeta: !!request.include_meta,
      metadata: request.queryMeta ?? {},
      // note: serializing is a little messed up, false will encode poorly.
      explain: request.explain || undefined,
    },
    now: new Array(inputLength).fill(safeNow),
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

export const formUrlForGRPC = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}:${urlObj.port || 443}`;
  } catch {
    return url;
  }
};

export const shouldUseInsecureChannel = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol.startsWith("http:");
  } catch {
    return false;
  }
};

export const headersToMetadata = (headers: ChalkHttpHeaders): Metadata => {
  const metadata = new Metadata();
  for (const header in headers) {
    const headerValue = headers[header];
    metadata.set(header, `${headerValue}`);
  }

  return metadata;
};

/**  Response-Related **/

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

export const mapGRPCChalkMeta = (
  meta: OnlineQueryMetadata | null | undefined
): ChalkQueryMeta | undefined => {
  if (meta == null) {
    return undefined;
  }

  const chalkMeta = {
    executionDurationS: 0,
    deploymentId: meta.deploymentId,
    environmentId: meta.environmentId,
    environmentName: meta.environmentName,
    queryId: meta.queryId,
    queryTimestamp: meta.queryTimestamp?.toISOString(),
    queryHash: meta.queryHash,
    explainOutput: meta.explainOutput?.planString,
    additionalMetadata: meta.additionalMetadata,
  };

  if (meta.executionDuration != null) {
    chalkMeta.executionDurationS =
      meta.executionDuration.seconds + meta.executionDuration.nanos / 1e9;
  }

  return chalkMeta;
};

export interface FeatureMeta {
  source_type: string;
  source_id: string;
  resolver_fqn: string;
}

export const mapGRPCFeatureMeta = (
  featureMeta: FeatureMeta
): ChalkFeatureMeta => ({
  chosenResolverFqn: featureMeta.resolver_fqn,
  cacheHit: featureMeta.source_type !== "live_resolver",
});

const metadataPrefix = "__chalk__.__result_metadata__.";
type MetadataKey<T extends string | number> =
  `__chalk__.__result_metadata__${T}`;

export const mapBulkQueryResponseGrpcToChalkOnlineResponse = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  response: OnlineQueryBulkResponse,
  parseOptions: Pick<ChalkClientConfig, "timestampFormat">
): ChalkOnlineQueryResponse<TFeatureMap, TOutput> => {
  const table = processArrowTable(
    tableFromIPC(response.scalarsData),
    parseOptions
  );
  const rawData = table.toArray()[0] ?? {};
  const features = Object.keys(rawData).filter(
    (key) => !key.startsWith(metadataPrefix) && key !== "__id__"
  );
  const errors = response.errors.map(mapGRPCChalkError);
  const metadataByFeature = new Map<string, FeatureMeta>(
    Object.entries(rawData)
      .filter(([key]) => key.startsWith(metadataPrefix))
      .map(([key, metadata]): [string, FeatureMeta] => [
        key.slice(metadataPrefix.length),
        metadata as FeatureMeta,
      ])
  );
  const errorsByFeature = new Map(
    errors
      .filter((err) => err.feature != null)
      .map((err) => [err.feature!, err])
  );

  const chalkResponse: ChalkOnlineQueryResponse<TFeatureMap, TOutput> = {
    data: Object.fromEntries(
      (features as TOutput[]).map(
        (
          feature
        ): [TOutput, ChalkOnlineQueryFeatureResult<TFeatureMap, TOutput>] => {
          const relatedError = errorsByFeature.get(feature as string);
          const relatedMeta = metadataByFeature.get(feature as string);
          return [
            feature,
            {
              value: unwrapArrowSpecificTypes(rawData[feature]),
              valid: true,
              error: relatedError,
              meta: relatedMeta ? mapGRPCFeatureMeta(relatedMeta) : undefined,
            },
          ];
        }
      )
    ) as { [K in TOutput]: ChalkOnlineQueryFeatureResult<TFeatureMap, K> },
    meta: mapGRPCChalkMeta(response.responseMeta),
    errors: response.errors.map(mapGRPCChalkError),
  };

  return chalkResponse;
};

export const mapBulkQueryResponseGrpcToChalk = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  response: OnlineQueryBulkResponse,
  parseOptions: Pick<ChalkClientConfig, "timestampFormat">
): ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput> => {
  const table = processArrowTable(
    tableFromIPC(response.scalarsData),
    parseOptions
  );
  const rawData = table.toArray();
  const features = new Set(
    Object.keys(rawData[0] ?? {}).filter(
      (key) => !key.startsWith(metadataPrefix) && key !== "__id__"
    )
  ) as Set<string>;
  const data = rawData.map((datum: Record<string, unknown>) =>
    Object.fromEntries(
      Object.entries(datum)
        .filter(([key]) => features.has(key))
        .map((key, value) => [key, unwrapArrowSpecificTypes(value)])
    )
  );

  const chalkResponse: ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput> = {
    data: data as { [K in TOutput]: TFeatureMap[K] }[],
    meta: mapGRPCChalkMeta(response.responseMeta),
    errors: response.errors.map(mapGRPCChalkError),
  };

  return chalkResponse;
};
