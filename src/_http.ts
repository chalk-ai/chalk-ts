import { chalkError, ChalkError, isChalkError } from "./_errors";
import { ChalkClientConfig, CustomFetchClient } from "./_types";
import { urlJoin } from "./_utils";

export interface ChalkHttpHeaders {
  "X-Chalk-Env-Id"?: string;
  "User-Agent"?: string;
}

const isoFetch: typeof fetch =
  typeof fetch !== "undefined" ? fetch : require("node-fetch");

const isoHeaders: typeof Headers =
  typeof Headers !== "undefined" ? Headers : require("node-fetch").Headers;

// https://github.com/microsoft/TypeScript/issues/23182
type IsNever<T> = [T] extends [never] ? true : false;

type PathParams<S extends string> =
  S extends `${infer _TPrefix}{${infer TParam}}${infer TRest}`
    ? TParam | PathParams<TRest>
    : never;

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
  };

const APPLICATION_JSON = "application/json;charset=utf-8";
const APPLICATION_OCTET = "application/octet-stream";

interface ClientCredentials {
  access_token: string;
  token_type: string;
  primary_environment?: string | null;
  expires_in: number;
  engines?: {
    [name: string]: string;
  };
}

export class CredentialsHolder {
  private credentials: ClientCredentials | null = null;

  constructor(
    private config: ChalkClientConfig,
    private http: ChalkHTTPService
  ) {}

  async get() {
    if (this.credentials == null) {
      try {
        return (this.credentials = await this.http.v1_oauth_token({
          baseUrl: this.config.apiServer,
          body: {
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: "client_credentials",
          },
        }));
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
          throw chalkError(e.message);
        } else {
          throw chalkError(
            "Unable to authenticate to Chalk servers. Please check your environment config"
          );
        }
      }
    }

    return this.credentials;
  }

  clear() {
    this.credentials = null;
  }
}

interface ChalkErrorData {
  code: string;
  category: string;
  message: string;
  exception?: {
    kind: string;
    message: string;
    stacktrace: string;
  };
  feature?: string;
  resolver?: string;
}

export class ChalkHTTPService {
  private fetchClient: CustomFetchClient;
  private fetchHeaders: typeof Headers;

  constructor(fetchClient?: CustomFetchClient, fetchHeaders?: typeof Headers) {
    this.fetchClient = fetchClient ?? (isoFetch as any); // cast for any's editor
    this.fetchHeaders = fetchHeaders ?? isoHeaders;
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
      const headers = new this.fetchHeaders();
      if (opts.binaryResponseBody) {
        headers.set("Accept", APPLICATION_OCTET);
        headers.set("Content-Type", APPLICATION_OCTET);
      } else {
        headers.set("Accept", APPLICATION_JSON);
        headers.set("Content-Type", APPLICATION_JSON);
      }
      headers.set("User-Agent", "chalk-ts v1.11.3");

      const credentials = await callArgs.credentials?.get();
      if (credentials != null) {
        headers.set("Authorization", `Bearer ${credentials.access_token}`);
      }

      if (credentials?.primary_environment != null) {
        headers.set("X-Chalk-Env-Id", credentials.primary_environment);
      }

      if (callArgs.headers?.["X-Chalk-Env-Id"] != null) {
        headers.set("X-Chalk-Env-Id", callArgs.headers["X-Chalk-Env-Id"]);
      }

      const body =
        callArgs.body !== undefined
          ? !opts.binaryResponseBody
            ? JSON.stringify(callArgs.body)
            : callArgs.body
          : undefined;

      const result = await this.fetchClient(
        urlJoin(callArgs.baseUrl, opts.path),
        {
          method: opts.method,
          headers,
          body: body as any,
        }
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
    },
    responseBody: null! as {
      data: {
        field: string;
        value: any;
        error?: ChalkErrorData;
        ts: string;
      }[];
      errors?: ChalkErrorData[];
      meta?: {
        execution_duration_s: number;
        deployment_id?: string;
        environment_id?: string;
        environment_name?: string;
        query_id?: string;
        query_timestamp?: string;
        query_hash?: string;
        explain_output?: string;
      };
    },
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
