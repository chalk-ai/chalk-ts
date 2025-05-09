import {
  ChalkOnlineQueryRawData,
  ChalkOnlineQueryRawResponse,
} from "./_services/_http";
import { ChalkClientConfig, ChalkOnlineQueryResponse } from "./_interface";
import { ChalkScalar } from "./_interface/_types";
import { fromEntries } from "./_utils";
import { mapRawResponseMeta } from "./_meta";
import { CHALK_DATE_TYPES } from "./_const";

type FeatureEntry<
  TFeatureMap = Record<string, ChalkScalar>,
  TOutput extends keyof TFeatureMap = keyof TFeatureMap
> = ChalkOnlineQueryResponse<TFeatureMap, TOutput>["data"][any];

const processDataValue = (
  d: ChalkOnlineQueryRawData,
  shouldConvertTimestampsToMillis = false
): ChalkScalar => {
  if (
    shouldConvertTimestampsToMillis &&
    CHALK_DATE_TYPES.has(d.meta?.primitive_type)
  ) {
    return new Date(d.value).getTime();
  }

  return d.value;
};

export const parseOnlineQueryResponse = <
  TFeatureMap = Record<string, ChalkScalar>,
  TOutput extends keyof TFeatureMap = keyof TFeatureMap
>(
  rawResult: ChalkOnlineQueryRawResponse,
  config: Pick<ChalkClientConfig, "timestampFormat">
): ChalkOnlineQueryResponse<TFeatureMap, TOutput> => {
  const shouldConvertTimestampsToMillis =
    config.timestampFormat === "EPOCH_MILLIS";

  return {
    data: fromEntries(
      rawResult.data.map((d): [string, FeatureEntry] => {
        return [
          d.field,
          {
            value: processDataValue(d, shouldConvertTimestampsToMillis),
            computedAt: d.ts != null ? new Date(d.ts) : undefined,
            error: d.error,
            valid: d.valid,
            meta: d.meta && {
              chosenResolverFqn: d.meta.chosen_resolver_fqn,
              cacheHit: d.meta.cache_hit,
              primitiveType: d.meta.primitive_type,
              version: d.meta.version,
            },
          },
        ];
      })
    ) as ChalkOnlineQueryResponse<TFeatureMap, TOutput>["data"],
    errors:
      rawResult.errors != null && rawResult.errors.length > 0
        ? rawResult.errors
        : undefined,
    meta: rawResult.meta ? mapRawResponseMeta(rawResult.meta) : undefined,
  };
};
