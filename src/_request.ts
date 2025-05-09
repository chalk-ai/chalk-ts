import {
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineQueryRequest,
} from "./_interface";

export const onlineSingleRequestToBulkRequest = <
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
): ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput> => {
  const { inputs, ...rest } = request;
  const bulkInput = Object.fromEntries(
    Object.entries(request.inputs).map(([key, value]) => [key, [value]])
  ) as Partial<{ [K in keyof TFeatureMap]: TFeatureMap[K][] }>;

  return {
    ...rest,
    inputs: bulkInput,
  };
};
