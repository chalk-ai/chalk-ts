import debounce = require("lodash.debounce");
import { DEFAULT_API_SERVER } from "./_const";
import { chalkError } from "./_errors";
import {
  ChalkHttpHeaders,
  CredentialsHolder,
  v1_get_run_status,
  v1_query_online,
  v1_trigger_resolver_run,
  v1_upload_single,
  v1_who_am_i,
} from "./_http";
import {
  ChalkClientInterface,
  ChalkGetRunStatusResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  ChalkTriggerResolverRunRequest,
  ChalkTriggerResolverRunResponse,
  ChalkUploadSingleRequest,
  ChalkWhoamiResponse,
} from "./_interface";
import {
  ChalkClientConfig,
  ChalkEnvironmentVariables,
  ChalkScalar,
} from "./_types";
import { fromEntries } from "./_utils";

export interface ChalkClientOpts {
  /**
   * Your Chalk Client ID. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientId?: string;

  /**
   * Your Chalk Client Secret. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientSecret?: string;

  /**
   * The URL of your chalk API server. Defaults to https://api.chalk.ai
   */
  apiServer?: string;

  /**
   * The environment that your client will run against. This value will be read from the _CHALK_ACTIVE_ENVIRONMENT environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  activeEnvironment?: string;
}

function valueWithEnvFallback(
  parameterNameForDebugging: string,
  constructorValue: string | undefined,
  name: keyof ChalkEnvironmentVariables
) {
  if (constructorValue != null) {
    return constructorValue;
  }

  const envValue = process?.env?.[name];
  if (envValue != null && envValue !== "") {
    return envValue;
  }

  throw new Error(
    `Chalk client parameter '${parameterNameForDebugging}' was not specified when creating your ChalkClient, and was not present as '${name}' in process.env. This field is required to use Chalk`
  );
}

const AUTH_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export class ChalkClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientInterface<TFeatureMap>
{
  private config: ChalkClientConfig;
  private credentials;

  constructor(opts?: {
    clientId?: string;
    clientSecret?: string;
    apiServer?: string;
    activeEnvironment?: string;
  }) {
    this.config = {
      activeEnvironment:
        opts?.activeEnvironment ??
        process.env._CHALK_ACTIVE_ENVIRONMENT ??
        undefined,
      clientSecret: valueWithEnvFallback(
        "clientSecret",
        opts?.clientSecret,
        "_CHALK_CLIENT_SECRET"
      ),
      apiServer:
        opts?.apiServer ?? process.env._CHALK_API_SERVER ?? DEFAULT_API_SERVER,
      clientId: valueWithEnvFallback(
        "clientId",
        opts?.clientId,
        "_CHALK_CLIENT_ID"
      ),
    };

    this.credentials = new CredentialsHolder(this.config);
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    this.debouncedRefreshAuth();
    return v1_who_am_i({
      baseUrl: this.config.apiServer,
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });
  }

  async getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse> {
    this.debouncedRefreshAuth();
    return v1_get_run_status({
      baseUrl: this.config.apiServer,
      pathParams: {
        run_id: runId,
      },
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });
  }

  async triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse> {
    this.debouncedRefreshAuth();
    return v1_trigger_resolver_run({
      baseUrl: this.config.apiServer,
      body: {
        resolver_fqn: request.resolverFqn,
      },
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });
  }

  async query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>> {
    this.debouncedRefreshAuth();
    const rawResult = await v1_query_online({
      baseUrl: this.config.apiServer,
      body: {
        inputs: request.inputs,
        outputs: request.outputs as string[],
        context: {
          tags: request.scopeTags,
        },
        correlation_id: request.correlationId,
        deployment_id: request.previewDeploymentId,
        meta: request.queryMeta,
        query_name: request.queryName,
        staleness: request.staleness,
      },
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });

    if (rawResult.errors != null && rawResult.errors.length > 0) {
      throw chalkError(rawResult.errors.map((e) => e.message).join("; "), {
        info: rawResult.errors,
      });
    }

    // Alias the map values so we can make TypeScript help us construct the response
    type FeatureEntry = ChalkOnlineQueryResponse<
      TFeatureMap,
      TOutput
    >["data"][any];

    return {
      data: fromEntries(
        rawResult.data.map((d): [string, FeatureEntry] => [
          d.field,
          {
            value: d.value,
            computedAt: new Date(d.ts),
          },
        ])
      ) as ChalkOnlineQueryResponse<TFeatureMap, TOutput>["data"],
    };
  }

  async uploadSingle(
    request: ChalkUploadSingleRequest<TFeatureMap>
  ): Promise<void> {
    this.debouncedRefreshAuth();
    const rawResult = await v1_upload_single({
      baseUrl: this.config.apiServer,
      body: {
        inputs: request.features,
        outputs: Object.keys(request.features),
        context: {
          tags: request.scopeTags,
        },
        correlation_id: request.correlationId,
        deployment_id: request.previewDeploymentId,
      },
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });

    if (rawResult.errors != null && rawResult.errors.length > 0) {
      throw chalkError(rawResult.errors.map((e) => e.message).join("; "), {
        info: rawResult.errors,
      });
    }
  }

  private getDefaultHeaders(): ChalkHttpHeaders {
    return {
      "X-Chalk-Env-Id": this.config.activeEnvironment,
      "User-Agent": "chalk-ts v1.11.3",
    };
  }

  private debouncedRefreshAuth = debounce(() => {
    this.credentials.refreshInBackground();
  }, AUTH_REFRESH_INTERVAL_MS);
}
