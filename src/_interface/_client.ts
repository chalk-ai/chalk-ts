import { ChalkScalar } from "./_types";
import {
  ChalkGetRunStatusResponse,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkOnlineMultiQueryRequest,
  ChalkOnlineMultiQueryResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  ChalkTriggerResolverRunRequest,
  ChalkTriggerResolverRunResponse,
  ChalkUploadSingleRequest,
  ChalkWhoamiResponse,
} from "./index";

export enum TimestampFormat {
  EPOCH_MILLIS = "EPOCH_MILLIS",
  ISO_8601 = "ISO_8601",
}

export interface ChalkClientConfig {
  activeEnvironment: string | undefined;
  apiServer: string;
  branch: string | undefined;
  clientId: string;
  clientSecret: string;
  queryServer: string | undefined;
  timestampFormat: TimestampFormat;
  useQueryServerFromCredentialExchange: boolean;
}

export interface ChalkClientInterface<
  TFeatureMap = Record<string, ChalkScalar>
> {
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
}

export interface ChalkClientHTTPInterface<
  TFeatureMap = Record<string, ChalkScalar>
> extends ChalkClientInterface<TFeatureMap> {
  /**
   * Retrieves the status of a resolver run.
   * See https://docs.chalk.ai/docs/runs for more information.
   * @param runId - The run ID of the resolver run.
   */
  getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse>;

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
