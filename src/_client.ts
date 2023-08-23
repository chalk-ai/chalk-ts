import { SpanStatusCode } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { DEFAULT_API_SERVER } from "./_const";
import { chalkError } from "./_errors";
import { ChalkHttpHeaders, ChalkHTTPService, CredentialsHolder } from "./_http";
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
  CustomFetchClient,
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

  /**
   * Tracing options that will be forwarded to the OTLP Trace Exporter. Traces are exported using http.
   * Traces can be exported to an OpenTelemetry collector and exported to any compatible tracing backend,
   * or can be exported to any compatible tracing backend directly.
   *
   * `url:` URL to export OpenTelemetry traces to. Defaults to http://localhost:4318/v1/traces.
   * If not specified, will use the environment variable _CHALK_TRACING_EXPORT_URL.
   *
   * `headers:` Headers to send with the trace http requests.
   *
   * `tracingActive:` Boolean that indicates whether to collect and export traces. Defaults to `false`.
   * If not specified, will use the environment variable _CHALK_TRACING_ACTIVE.
   */
  tracingOptions?: TracingOptions;

  /**
   * A custom fetch client that will replace the fetch polyfill used by default.
   *
   * If not provided, the client will use the default fetch polyfill (native fetch with node-fetch as a fallback).
   */
  fetch?: CustomFetchClient;

  /**
   * A custom fetch headers object that will replace the fetch Headers polyfill used by default.
   *
   * If not provided, the client will use the default fetch Headers polyfill (native fetch with node-fetch as a fallback).
   */
  fetchHeaders?: typeof Headers;
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
  private http: ChalkHTTPService;
  private credentials;
  private sdk?: NodeSDK;
  private processor?: BatchSpanProcessor;

  constructor(opts?: {
    clientId?: string;
    clientSecret?: string;
    apiServer?: string;
    activeEnvironment?: string;
    tracingOptions?: TracingOptions;
    fetch?: CustomFetchClient;
    fetchHeaders?: typeof Headers;
  }) {
    if (
      opts?.tracingOptions?.tracingActive ||
      process.env._CHALK_TRACING_ACTIVE === "true"
    ) {
      const { sdk, processor } = initializeTracing({
        url: opts?.tracingOptions?.url ?? process.env._CHALK_TRACING_EXPORT_URL,
        ...opts?.tracingOptions,
      });
      this.sdk = sdk;
      this.processor = processor;
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

    this.http = new ChalkHTTPService(opts?.fetch, opts?.fetchHeaders);

    this.credentials = new CredentialsHolder(this.config, this.http);
  }

  async flushTraces() {
    await this.processor?.forceFlush();
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    return getTracer().startActiveSpan("who_am_i", async (span) => {
      span.setAttributes({
        activeEnvironment: this.config.activeEnvironment,
        apiServer: this.config.apiServer,
      });
      const out = await this.http.v1_who_am_i({
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
      span.setAttributes({
        runId: runId,
        activeEnvironment: this.config.activeEnvironment,
        apiServer: this.config.apiServer,
      });
      const out = await this.http.v1_get_run_status({
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
      span.setAttributes({
        resolverFqn: request.resolverFqn,
        activeEnvironment: this.config.activeEnvironment,
        apiServer: this.config.apiServer,
      });
      const out = await this.http.v1_trigger_resolver_run({
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
      span.setAttributes({
        correlationId: request.correlationId,
        previewDeploymentId: request.previewDeploymentId,
        queryName: request.queryName,
        activeEnvironment: this.config.activeEnvironment,
        apiServer: this.config.apiServer,
      });
      const rawResult = await this.http.v1_query_online({
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
          encoding_options: request.encodingOptions
            ? {
                encode_structs_as_objects:
                  request.encodingOptions.encodeStructsAsObjects,
              }
            : undefined,
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
    return await getTracer().startActiveSpan("upload_single", async (span) => {
      span.setAttributes({
        correlationId: request.correlationId,
        previewDeploymentId: request.previewDeploymentId,
        activeEnvironment: this.config.activeEnvironment,
        apiServer: this.config.apiServer,
      });
      const rawResult = await this.http.v1_upload_single({
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
