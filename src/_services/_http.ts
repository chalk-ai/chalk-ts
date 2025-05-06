import { ChalkError, isChalkError } from "../_errors";
import {
  ChalkPrimitiveType,
  CustomFetchClient,
  IsNever,
  PathParams,
} from "../_interface/_types";
import { urlJoin } from "../_utils";

import { USER_AGENT } from "../_user_agent";
import { ChalkErrorData } from "../_interface";
import { ClientCredentials, CredentialsHolder } from "./_credentials";

/**
 * An interface recording available headers that can be sent to the chalk engine to change its behavior.
 * */
export interface ChalkHttpHeadersStrict {
  "X-Chalk-Env-Id"?: string;
  "X-Chalk-Branch-Id"?: string;
  /**
   * If specified, changes which type of engine deployment to target.
   * The typescript client does not yet communicate with grpc engines, use carefully!
   */
  "X-Chalk-Deployment-Type"?: "engine" | "engine-grpc";
  /**
   * If true, assumes explicit versioning of the versions and ignores default.
   * This also means that the output data shape always matches the query requested output.
   *
   * ex. class.versioned_feature with a default v2 will return the v1 resolver data under the
   * field "class.versioned_feature", instead of v2 resolver data on the field "class.versioned_feature@v2"
   * */
  "X-Chalk-Features-Versioned"?: boolean;
  /**
   * Specifies which resource group should be targeted for executing the query.
   */
  "X-Chalk-Resource-Group"?: string;
  "User-Agent"?: string;
}

type ChalkHttpHeadersKeys = keyof ChalkHttpHeadersStrict;
interface ChalkHttpHeadersFreeform {
  [key: Exclude<string, ChalkHttpHeadersKeys>]: string | number | boolean;
}

export type ChalkHttpHeaders = ChalkHttpHeadersFreeform &
  ChalkHttpHeadersStrict;

const isoFetch: typeof fetch =
  typeof fetch !== "undefined" ? fetch : require("node-fetch");

const isoHeaders: typeof Headers =
  typeof Headers !== "undefined" ? Headers : require("node-fetch").Headers;

type EndpointCallArgs_Body<TRequestBody> = IsNever<TRequestBody> extends true
  ? {
      body?: undefined;
    }
  : {
      body: TRequestBody;
    };

type EndpointCallArgs_PathParams<TPath extends string> = IsNever<
  PathParams<TPath>
> extends true
  ? {
      pathParams?: undefined;
    }
  : {
      pathParams: {
        [K in PathParams<TPath>]: string;
      };
    };

type EndpointCallArgs_AuthKind<TAuthKind extends "required" | "none"> =
  TAuthKind extends "required"
    ? {
        credentials: CredentialsHolder;
      }
    : {
        credentials?: undefined;
      };

type EndpointCallArgs<
  TPath extends string,
  TRequestBody,
  TAuthKind extends "required" | "none"
> = EndpointCallArgs_Body<TRequestBody> &
  EndpointCallArgs_PathParams<TPath> &
  EndpointCallArgs_AuthKind<TAuthKind> & {
    baseUrl: string;
    headers?: ChalkHttpHeaders;
    timeout?: number;
  };

export interface RawQueryResponseMeta {
  execution_duration_s: number;
  deployment_id?: string;
  environment_id?: string;
  environment_name?: string;
  query_id?: string;
  query_timestamp?: string;
  query_hash?: string;
  explain_output?: string;
}

const APPLICATION_JSON = "application/json;charset=utf-8";
const APPLICATION_OCTET = "application/octet-stream";

async function awaitTimeout(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

async function retryFetch(
  fetch: CustomFetchClient,
  url: string,
  options: RequestInit,
  retries: number,
  backoff = 100
): Promise<Response> {
  let lastError: Error | undefined;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (e) {
      if (e instanceof DOMException) {
        // Don't retry timeouts.
        throw e;
      }

      lastError = e as Error;
      await awaitTimeout(backoff * 2 ** i);
    }
  }

  throw lastError;
}

export interface ChalkOnlineQueryRawData {
  field: string;
  value: any;
  pkey?: null | string | number;
  error?: ChalkErrorData;
  valid?: boolean;
  ts?: string;
  meta?: {
    chosen_resolver_fqn?: string;
    cache_hit?: boolean;
    primitive_type?: ChalkPrimitiveType;
    version?: number;
  };
}

export interface ChalkOnlineQueryRawResponse {
  data: ChalkOnlineQueryRawData[];
  errors?: ChalkErrorData[];
  meta?: RawQueryResponseMeta;
}

export class ChalkHTTPService {
  private fetchClient: CustomFetchClient;
  private fetchHeaders: typeof Headers;
  private defaultTimeout: number | undefined;
  private additionalHeaders: ChalkHttpHeaders | undefined;
  private maxNetworkRetries: number;

  constructor(
    fetchClient?: CustomFetchClient,
    fetchHeaders?: typeof Headers,
    defaultTimeout?: number,
    additionalHeaders?: ChalkHttpHeaders,
    maxNetworkRetries: number = 3
  ) {
    this.fetchClient = fetchClient ?? (isoFetch as any); // cast for any's editor
    this.fetchHeaders = fetchHeaders ?? isoHeaders;
    this.defaultTimeout = defaultTimeout;
    this.additionalHeaders = additionalHeaders;
    this.maxNetworkRetries = maxNetworkRetries;
  }

  private createEndpoint<
    TPath extends string,
    TAuthKind extends "required" | "none",
    TRequestBody = never,
    TResponseBody = never
  >(opts: {
    path: TPath;
    authKind: TAuthKind;
    method: "GET" | "PUT" | "POST" | "DELETE" | "PATCH";
    requestBody?: TRequestBody;
    responseBody?: TResponseBody;
    binaryResponseBody?: boolean;
  }) {
    const makeRequest = async (
      callArgs: EndpointCallArgs<TPath, TRequestBody, TAuthKind>
    ): Promise<TResponseBody> => {
      const headers: Headers = new this.fetchHeaders();
      if (opts.binaryResponseBody) {
        headers.set("Accept", APPLICATION_OCTET);
        headers.set("Content-Type", APPLICATION_OCTET);
      } else {
        headers.set("Accept", APPLICATION_JSON);
        headers.set("Content-Type", APPLICATION_JSON);
      }
      headers.set("User-Agent", USER_AGENT);

      const credentials: ClientCredentials | undefined =
        await callArgs.credentials?.get();
      if (credentials != null) {
        headers.set("Authorization", `Bearer ${credentials.access_token}`);
      }

      // the environment header from the credentials will be overridden by any
      // environment that is set locally via callArgs.headers
      if (credentials?.primary_environment != null && credentials != null) {
        headers.set("X-Chalk-Env-Id", credentials.primary_environment);
      }

      const effectiveTimeout = callArgs.timeout ?? this.defaultTimeout;

      if (effectiveTimeout != null) {
        headers.set("X-Chalk-Timeout", effectiveTimeout.toString());
      }

      // Explicit precedence:
      // 1. callArgs.headers are provided at the time the function is called.
      // 2. this.additionalHeaders are provided when the client is created.
      // So call site > client
      if (this.additionalHeaders != null) {
        for (const [key, value] of Object.entries(this.additionalHeaders)) {
          headers.set(key, `${value}`);
        }
      }
      if (callArgs.headers != null) {
        for (const [key, value] of Object.entries(callArgs.headers)) {
          headers.set(key, `${value}`);
        }
      }

      const body =
        callArgs.body !== undefined
          ? !opts.binaryResponseBody
            ? JSON.stringify(callArgs.body)
            : callArgs.body
          : undefined;

      try {
        const result = await retryFetch(
          this.fetchClient,
          urlJoin(callArgs.baseUrl, opts.path),
          {
            method: opts.method,
            headers,
            body: body as any,
            signal:
              effectiveTimeout != null
                ? AbortSignal.timeout(effectiveTimeout)
                : undefined,
          },
          this.maxNetworkRetries
        );
        if (result.status < 200 || result.status >= 300) {
          const errorText = await result.text();
          throw new ChalkError(errorText, {
            httpStatus: result.status,
            httpStatusText: result.statusText,
          });
        }

        if (opts.binaryResponseBody) {
          return result.arrayBuffer() as any;
        } else {
          return result.json() as any as TResponseBody;
        }
      } catch (e) {
        if (e instanceof DOMException) {
          throw new ChalkError(
            "Request timed out after " + effectiveTimeout + "ms"
          );
        } else {
          throw e;
        }
      }
    };

    return async (
      callArgs: EndpointCallArgs<TPath, TRequestBody, TAuthKind>
    ) => {
      try {
        return await makeRequest(callArgs);
      } catch (e) {
        if (
          isChalkError(e) &&
          e.httpStatus == 401 &&
          opts.authKind === "required"
        ) {
          callArgs.credentials?.clear();
          return makeRequest(callArgs);
        } else {
          // re-throw the error if we aren't recovering from it
          throw e;
        }
      }
    };
  }

  public v1_who_am_i = this.createEndpoint({
    method: "GET",
    path: "/v1/who-am-i",
    authKind: "required",
    responseBody: null! as {
      user: string;
    },
  });

  public v1_get_run_status = this.createEndpoint({
    method: "GET",
    path: "/v1/runs/{run_id}",
    authKind: "required",
    responseBody: null! as {
      id: string;
      status: "received" | "succeeded" | "failed";
    },
  });

  public v1_trigger_resolver_run = this.createEndpoint({
    method: "POST",
    path: "/v1/runs/trigger",
    authKind: "required",
    requestBody: null! as {
      resolver_fqn: string;
    },
    responseBody: null! as {
      id: string;
      status: "received" | "succeeded" | "failed";
    },
  });

  public v1_query_online = this.createEndpoint({
    method: "POST",
    path: "/v1/query/online",
    authKind: "required",
    requestBody: null! as {
      inputs: {
        [fqn: string]: any;
      };
      outputs: string[];
      staleness?: {
        [fqn: string]: string | undefined;
      };
      context?: {
        environment?: string;
        tags?: string[];
      };
      query_context?: {
        [key: string]: string | number | boolean;
      };
      deployment_id?: string;
      correlation_id?: string;
      query_name?: string;
      meta?: {
        [key: string]: string;
      };
      now?: string;
      encoding_options?: {
        encode_structs_as_objects?: boolean;
      };
      include_meta: boolean;
      planner_options?: { [index: string]: string | boolean | number };
    },
    responseBody: null! as ChalkOnlineQueryRawResponse,
  });

  public v1_query_feather = this.createEndpoint({
    method: "POST",
    path: "/v1/query/feather",
    authKind: "required",
    requestBody: null! as ArrayBufferLike,
    binaryResponseBody: true,
  });

  public v1_upload_single = this.createEndpoint({
    method: "POST",
    path: "/v1/upload/single",
    authKind: "required",
    requestBody: null! as {
      inputs: {
        [fqn: string]: any;
      };
      outputs: string[];
      staleness?: {
        [fqn: string]: string | undefined;
      };
      context?: {
        environment?: string;
        tags?: string[];
      };
      deployment_id?: string;
      correlation_id?: string;
      query_name?: string;
      meta?: {
        [key: string]: string;
      };
    },
    responseBody: null! as {
      data: {
        field: string;
        value: any;
        error?: ChalkErrorData;
        ts: string;
      }[];
      errors?: ChalkErrorData[];
    },
  });

  public v1_oauth_token = this.createEndpoint({
    method: "POST",
    path: "/v1/oauth/token",
    authKind: "none",
    requestBody: null! as {
      client_id: string;
      client_secret: string;
      grant_type: string;
    },
    responseBody: null! as ClientCredentials,
  });
}
