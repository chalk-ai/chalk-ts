import { ChalkOnlineQueryRawResponse } from "./_http";
import { ChalkOnlineQueryResponse } from "./_interface";
import { ChalkScalar } from "./_types";
import { fromEntries } from "./_utils";
import { mapRawResponseMeta } from "./_meta";

type FeatureEntry<
  TFeatureMap = Record<string, ChalkScalar>,
  TOutput extends keyof TFeatureMap = keyof TFeatureMap
> = ChalkOnlineQueryResponse<TFeatureMap, TOutput>["data"][any];

export const parseOnlineQueryResponse = <
  TFeatureMap = Record<string, ChalkScalar>,
  TOutput extends keyof TFeatureMap = keyof TFeatureMap
>(
  rawResult: ChalkOnlineQueryRawResponse
): ChalkOnlineQueryResponse<TFeatureMap, TOutput> => {
  return {
    data: fromEntries(
      rawResult.data.map((d): [string, FeatureEntry] => [
        d.field,
        {
          value: d.value,
          computedAt: d.ts != null ? new Date(d.ts) : undefined,
          error: d.error,
          meta: d.meta && {
            chosenResolverFqn: d.meta.chosen_resolver_fqn,
            cacheHit: d.meta.cache_hit,
            primitiveType: d.meta.primitive_type,
            version: d.meta.version,
          },
        },
      ])
    ) as ChalkOnlineQueryResponse<TFeatureMap, TOutput>["data"],
    errors:
      rawResult.errors == null || rawResult.errors.length
        ? undefined
        : rawResult.errors,
    meta: rawResult.meta ? mapRawResponseMeta(rawResult.meta) : undefined,
  };
};
