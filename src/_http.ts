import { ChalkError } from "./_errors";
import { urlJoin } from "./_utils";

export interface ChalkHttpHeaders {
  Authorization: string;
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
  S extends `${infer TPrefix}{${infer TParam}}${infer TRest}`
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

type EndpointCallArgs<
  TPath extends string,
  TRequestBody
> = EndpointCallArgs_Body<TRequestBody> &
  EndpointCallArgs_PathParams<TPath> & {
    baseUrl: string;
    headers: ChalkHttpHeaders;
  };

const APPLICATION_JSON = "application/json?charset=utf-8";

function createEndpoint<
  TPath extends string,
  TRequestBody = never,
  TResponseBody = never
>(opts: {
  path: TPath;
  method: "GET" | "PUT" | "POST" | "DELETE" | "PATCH";
  requestBody?: TRequestBody;
  responseBody?: TResponseBody;
}) {
  return async (callArgs: EndpointCallArgs<TPath, TRequestBody>) => {
    const headers = new Headers();
    headers.set("Accept", APPLICATION_JSON);
    headers.set("Content-Type", APPLICATION_JSON);
    headers.set("Authorization", callArgs.headers.Authorization);

    if (callArgs.headers["X-Chalk-Env-Id"] != null) {
      headers.set("X-Chalk-Env-Id", callArgs.headers["X-Chalk-Env-Id"]);
    }

    const body =
      callArgs.body !== undefined ? JSON.stringify(callArgs.body) : undefined;
    let result;
    try {
      result = await isoFetch(urlJoin(callArgs.baseUrl, opts.path), {
        method: opts.method,
        headers,
        body,
      });
    } catch (e) {
      if (e instanceof Error) {
        throw new ChalkError(e.message);
      } else {
        throw new ChalkError("Unknown error");
      }
    }

    if (result.status < 200 || result.status >= 300) {
      throw new ChalkError(await result.text(), {
        httpStatus: result.status,
        httpStatusText: result.statusText,
      });
    }
  };
}

export const v1_who_am_i = createEndpoint({
  method: "GET",
  path: "/v1/who-am-i",
  responseBody: null! as {
    user: string;
  },
});

export const v1_get_run_status = createEndpoint({
  method: "GET",
  path: "/v1/runs/{run_id}",
  responseBody: null! as {
    id: string;
    status: "received" | "succeeded" | "failed";
  },
});

export const v1_trigger_resolver_run = createEndpoint({
  method: "POST",
  path: "/v1/runs/trigger",
  responseBody: null! as {
    id: string;
    status: "received" | "succeeded" | "failed";
  },
});

interface ChalkError {
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
  requestBody: null! as {
    inputs: {
      [fqn: string]: any;
    };
    outputs: string[];
    staleness?: {
      [fqn: string]: string;
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
      error?: ChalkError;
      ts: string;
    }[];
    errors?: ChalkError[];
  },
});
