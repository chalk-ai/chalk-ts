import { RawQueryResponseMeta } from "./_http";
import { ChalkQueryMeta } from "./_interface";

export function mapRawResponseMeta(raw: RawQueryResponseMeta): ChalkQueryMeta {
  return {
    executionDurationS: raw.execution_duration_s,
    deploymentId: raw.deployment_id,
    environmentId: raw.environment_id,
    environmentName: raw.environment_name,
    queryId: raw.query_id,
    queryTimestamp: raw.query_timestamp,
    queryHash: raw.query_hash,
    explainOutput: raw.explain_output,
  };
}
