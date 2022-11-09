import { ChalkError, isChalkError } from "./_errors";
import { urlJoin } from "./_utils";

export interface ChalkHttpHeaders {
  "X-Chalk-Env-Id"?: string;
}

const isoFetch: typeof fetch =
  typeof fetch !== "undefined"
    ? fetch
    : typeof require !== "undefined"
    ? require("node-fetch")
    : (() => {
        throw new Error("No fetch() found, and not running from Node context");
      })();

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

const APPLICATION_JSON = "application/json?charset=utf-8";

interface ClientCredentials {
  access_token: string;
  token_type: string;
  expires_in: number;
  engines?: {
    [name: string]: string;
  };
}

export class CredentialsHolder {
  private credentials: ClientCredentials | null = null;

  constructor(private baseUrl: string) {}
  async get() {
    if (this.credentials != null) {
      try {
        this.credentials = await v1_oauth_token({
          baseUrl: this.baseUrl,
        });
      } catch (e) {
        console.error("Error getting Chalk auth token: ", e);
      }
    }

    return this.credentials;
  }

  clear() {
    this.credentials = null;
  }
}

function isSuccessCode(code: number) {
  return code >= 200 && code < 300;
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
    const headers = new Headers();
    headers.set("Accept", APPLICATION_JSON);
    headers.set("Content-Type", APPLICATION_JSON);

    let token = await callArgs.credentials?.get();
    if (token != null) {
      headers.set("Authorization", `Bearer ${token}`);
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
      return makeRequest(callArgs);
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

export const v1_oauth_token = createEndpoint({
  method: "GET",
  path: "/v1/oauth/token",
  authKind: "none",
  responseBody: null! as ClientCredentials,
});
