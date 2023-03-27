import { SpanStatusCode } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
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
import { getTracer, initializeTracing, TracingOptions } from "./_tracing";
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

export class ChalkClient<TFeatureMap = Record<string, ChalkScalar>>
  implements ChalkClientInterface<TFeatureMap>
{
  private config: ChalkClientConfig;
  private credentials;
  private tracingSDK?: NodeSDK;

  constructor(opts?: {
    clientId?: string;
    clientSecret?: string;
    apiServer?: string;
    activeEnvironment?: string;
    tracingOptions?: TracingOptions;
  }) {
    if (
      opts?.tracingOptions?.tracingActive ||
      process.env._CHALK_TRACING_ACTIVE === "true"
    ) {
      this.tracingSDK = initializeTracing({
        headers: opts?.tracingOptions?.headers,
        url:
          opts?.tracingOptions?.url ??
          process.env._CHALK_OTEL_EXPORTER_OTLP_ENDPOINT ??
          "http://localhost:4318/v1/traces",
      });
    }

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

  flushTraces() {
    this.tracingSDK?.shutdown();
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    return getTracer().startActiveSpan("who_am_i", async (span) => {
      const out = await v1_who_am_i({
        baseUrl: this.config.apiServer,
        headers: this.getDefaultHeaders(),
        credentials: this.credentials,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return out;
    });
  }

  async getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse> {
    return getTracer().startActiveSpan("get_run_status", async (span) => {
      const out = await v1_get_run_status({
        baseUrl: this.config.apiServer,
        pathParams: {
          run_id: runId,
        },
        headers: this.getDefaultHeaders(),
        credentials: this.credentials,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return out;
    });
  }

  async triggerResolverRun(
    request: ChalkTriggerResolverRunRequest
  ): Promise<ChalkTriggerResolverRunResponse> {
    return getTracer().startActiveSpan("trigger_resolver_run", async (span) => {
      const out = await v1_trigger_resolver_run({
        baseUrl: this.config.apiServer,
        body: {
          resolver_fqn: request.resolverFqn,
        },
        headers: this.getDefaultHeaders(),
        credentials: this.credentials,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return out;
    });
  }

  async query<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineQueryResponse<TFeatureMap, TOutput>> {
    return getTracer().startActiveSpan("query", async (span) => {
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
        const errorText = rawResult.errors.map((e) => e.message).join("; ");
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorText });
        span.end();
        throw chalkError(errorText, {
          info: rawResult.errors,
        });
      }

      // Alias the map values so we can make TypeScript help us construct the response
      type FeatureEntry = ChalkOnlineQueryResponse<
        TFeatureMap,
        TOutput
      >["data"][any];

      const out = {
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
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return out;
    });
  }

  async uploadSingle(
    request: ChalkUploadSingleRequest<TFeatureMap>
  ): Promise<void> {
    getTracer().startActiveSpan("upload_single", async (span) => {
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
        const errorText = rawResult.errors.map((e) => e.message).join("; ");
        span.setStatus({ code: SpanStatusCode.ERROR, message: errorText });
        span.end();
        throw chalkError(errorText, {
          info: rawResult.errors,
        });
      }
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    });
  }

  private getDefaultHeaders(): ChalkHttpHeaders {
    return {
      "X-Chalk-Env-Id": this.config.activeEnvironment,
      "User-Agent": "chalk-ts v1.11.3",
    };
  }
}
