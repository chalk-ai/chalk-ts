import { chalkError, ChalkError, isChalkError } from "./_errors";
import { ChalkClientConfig } from "./_types";
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
  // The most recent credentials request, as a promise. On failure, this value will be
  // nulled so subsequent calls to the CredentialsHolder will initiate a new request
  private credentials: Promise<ClientCredentials> | null = null;

  constructor(private config: ChalkClientConfig) {}
  async get() {
    if (this.credentials == null) {
      this.credentials = this.makeRequest().catch((e) => {
        this.credentials = null;

        if (e instanceof Error) {
          throw chalkError(e.message);
        } else {
          throw chalkError(
            "Unable to authenticate to Chalk servers. Please check your environment config"
          );
        }
      });
    }

    return this.credentials;
  }

  async refreshInBackground() {
    const request = this.makeRequest();
    request.then(() => {
      // update stored credentials on success
      this.credentials = request;
    }, (e) => {
      // Background refresh failed. Log an error to the user
      console.warn("Error when refreshing Chalk authentication; please check your environment config", e)
    });
  }

  clear() {
    this.credentials = null;
  }

  private makeRequest() {
    return v1_oauth_token({
      baseUrl: this.config.apiServer,
      body: {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: "client_credentials",
      },
    })
  }
}

function createEndpoint<
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
}) {
  const makeRequest = async (
    callArgs: EndpointCallArgs<TPath, TRequestBody, TAuthKind>
  ) => {
    const headers = new isoHeaders();
    headers.set("Accept", APPLICATION_JSON);
    headers.set("Content-Type", APPLICATION_JSON);
    headers.set("User-Agent", "chalk-ts v1.11.3");

    let credentials = await callArgs.credentials?.get();
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
      callArgs.body !== undefined ? JSON.stringify(callArgs.body) : undefined;

    let result = await isoFetch(urlJoin(callArgs.baseUrl, opts.path), {
      method: opts.method,
      headers,
      body,
    });

    if (result.status < 200 || result.status >= 300) {
      throw new ChalkError(await result.text(), {
        httpStatus: result.status,
        httpStatusText: result.statusText,
      });
    }

    return result.json() as TResponseBody;
  };

  return async (callArgs: EndpointCallArgs<TPath, TRequestBody, TAuthKind>) => {
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

export const v1_who_am_i = createEndpoint({
  method: "GET",
  path: "/v1/who-am-i",
  authKind: "required",
  responseBody: null! as {
    user: string;
  },
});

export const v1_get_run_status = createEndpoint({
  method: "GET",
  path: "/v1/runs/{run_id}",
  authKind: "required",
  responseBody: null! as {
    id: string;
    status: "received" | "succeeded" | "failed";
  },
});

export const v1_trigger_resolver_run = createEndpoint({
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

export const v1_query_online = createEndpoint({
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

export const v1_upload_single = createEndpoint({
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

export const v1_oauth_token = createEndpoint({
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
