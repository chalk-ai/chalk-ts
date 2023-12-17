import { tableFromArrays, tableFromIPC, tableToIPC } from "apache-arrow";
import { parseByteModel } from "./_bulk_response";
import { DEFAULT_API_SERVER } from "./_const";
import { chalkError } from "./_errors";
import { ChalkHttpHeaders, ChalkHTTPService, CredentialsHolder } from "./_http";
import {
  ChalkClientInterface,
  ChalkGetRunStatusResponse,
  ChalkOnlineQueryRequest,
  ChalkOnlineQueryResponse,
  ChalkOnlineBulkQueryRequest,
  ChalkOnlineBulkQueryResponse,
  ChalkTriggerResolverRunRequest,
  ChalkTriggerResolverRunResponse,
  ChalkUploadSingleRequest,
  ChalkWhoamiResponse,
} from "./_interface";
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

  constructor(opts?: {
    clientId?: string;
    clientSecret?: string;
    apiServer?: string;
    activeEnvironment?: string;
    fetch?: CustomFetchClient;
    fetchHeaders?: typeof Headers;
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

    this.http = new ChalkHTTPService(opts?.fetch, opts?.fetchHeaders);

    this.credentials = new CredentialsHolder(this.config, this.http);
  }

  async whoami(): Promise<ChalkWhoamiResponse> {
    return this.http.v1_who_am_i({
      baseUrl: this.config.apiServer,
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });
  }

  async getRunStatus(runId: string): Promise<ChalkGetRunStatusResponse> {
    return this.http.v1_get_run_status({
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
    return this.http.v1_trigger_resolver_run({
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
        now: request.now,
        encoding_options: request.encodingOptions
          ? {
              encode_structs_as_objects:
                request.encodingOptions.encodeStructsAsObjects,
            }
          : undefined,
        include_meta: !!request.include_meta,
      },
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });

    if (rawResult.errors != null && rawResult.errors.length > 0) {
      const errorText = rawResult.errors.map((e) => e.message).join("; ");
      throw chalkError(errorText, {
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

  async queryBulk<TOutput extends keyof TFeatureMap>(
    request: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>
  ): Promise<ChalkOnlineBulkQueryResponse<TFeatureMap, TOutput>> {
    const onlineQueryJsonBody = {
      inputs: request.inputs as any,
      outputs: request.outputs as string[],
      context: {
        tags: request.scopeTags,
      },
      correlation_id: request.correlationId,
      deployment_id: request.previewDeploymentId,
      meta: request.queryMeta,
      query_name: request.queryName,
      staleness: request.staleness,
      now: request.now,
    };

    const header = {
      ...onlineQueryJsonBody,
      feather_body_type: "RECORD_BATCHES",
      response_compression_scheme: "uncompressed",
      client_supports_64bit: false,
    };
    delete header["inputs"];

    let utf8Encode = new TextEncoder();
    let utf8Decode = new TextDecoder();
    const magicBytes = utf8Encode.encode("chal1"); // magic str
    const jsonedHeader = JSON.stringify(header);

    const headerBytes = utf8Encode.encode(jsonedHeader);

    const arrowTable = tableFromArrays(request.inputs as any);
    const bodyBytes = tableToIPC(arrowTable);

    const arrayBuffer = Buffer.alloc(
      magicBytes.length + headerBytes.length + bodyBytes.length + 2 * 8
    );

    let offset = 0;

    arrayBuffer.write("chal1", 0);
    offset += magicBytes.length;

    arrayBuffer.writeBigInt64BE(BigInt(headerBytes.length), offset);
    offset += 8;

    arrayBuffer.set(headerBytes, offset);
    offset += headerBytes.length;

    arrayBuffer.writeBigInt64BE(BigInt(bodyBytes.length), offset);
    offset += 8;

    arrayBuffer.set(bodyBytes, offset);

    const rawResult = await this.http.v1_query_feather({
      baseUrl: this.config.apiServer,
      body: arrayBuffer.buffer,
      headers: this.getDefaultHeaders(),
      credentials: this.credentials,
    });

    const result = Buffer.from(rawResult);

    const outer = parseByteModel(result);

    const inner = parseByteModel(
      outer.concatenatedSerializableByteObjects.subarray(
        0,
        outer.attrAndByteOffsetForSerializables["query_results_bytes"]
      )
    );

    const innerInner = parseByteModel(inner.concatenatedByteObjects);
    const ipcTable = tableFromIPC(innerInner.concatenatedByteObjects);

    return {
      data: ipcTable.toArray() as any,
    };
  }

  async uploadSingle(
    request: ChalkUploadSingleRequest<TFeatureMap>
  ): Promise<void> {
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
      throw chalkError(errorText, {
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
}
