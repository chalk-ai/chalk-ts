import { ChalkClient } from "../_client";
import { DEFAULT_API_SERVER } from "../_const";
import { TimestampFormat } from "../_interface";
import { ChalkClientConfig } from "../_types";

function getConfig(client: ChalkClient): ChalkClientConfig {
  return (client as any).config;
}

const isoHeaders: typeof Headers =
  typeof Headers !== "undefined" ? Headers : require("node-fetch").Headers;

describe("ChalkClient", () => {
  let originalEnv: any;
  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    process.env = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("constructor doesn't throw", () => {
    new ChalkClient({
      activeEnvironment: "a",
      apiServer: "a",
      clientId: "a",
      clientSecret: "a",
    });
  });

  it("saves passed configuration", () => {
    const client = new ChalkClient({
      activeEnvironment: "a",
      apiServer: "b",
      branch: "c",
      clientId: "d",
      clientSecret: "e",
      timestampFormat: TimestampFormat.EPOCH_MILLIS,
    });

    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: "a",
      apiServer: "b",
      branch: "c",
      clientId: "d",
      clientSecret: "e",
      queryServer: "b",
      timestampFormat: TimestampFormat.EPOCH_MILLIS,
    });
  });

  it("reads from environment variables when set", () => {
    process.env._CHALK_ACTIVE_ENVIRONMENT = "env";
    process.env._CHALK_API_SERVER = "http://localhost:8000";
    process.env._CHALK_BRANCH = "not_a_real_branch";
    process.env._CHALK_CLIENT_ID = "client_id";
    process.env._CHALK_CLIENT_SECRET = "secret";
    process.env._CHALK_QUERY_SERVER = "http://localhost:1337";

    const client = new ChalkClient();

    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: "env",
      apiServer: "http://localhost:8000",
      branch: "not_a_real_branch",
      clientId: "client_id",
      clientSecret: "secret",
      queryServer: "http://localhost:1337",
      timestampFormat: TimestampFormat.ISO_8601,
    });
  });

  it("doesn't throw if activeEnvironment isn't specified [process.env]", () => {
    process.env._CHALK_API_SERVER = "http://localhost:8000";
    process.env._CHALK_CLIENT_ID = "client_id";
    process.env._CHALK_CLIENT_SECRET = "secret";

    new ChalkClient();
  });

  it("uses default API server if not specified", () => {
    process.env._CHALK_CLIENT_ID = "client_id";
    process.env._CHALK_CLIENT_SECRET = "secret";

    const client = new ChalkClient();
    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: undefined,
      apiServer: DEFAULT_API_SERVER,
      branch: undefined,
      clientId: "client_id",
      clientSecret: "secret",
      queryServer: DEFAULT_API_SERVER,
      timestampFormat: TimestampFormat.ISO_8601,
    });
  });

  it("allows specifying a query server", () => {
    process.env._CHALK_CLIENT_ID = "client_id";
    process.env._CHALK_CLIENT_SECRET = "secret";

    const client = new ChalkClient({ queryServer: "query server" });
    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: undefined,
      apiServer: DEFAULT_API_SERVER,
      branch: undefined,
      clientId: "client_id",
      clientSecret: "secret",
      queryServer: "query server",
      timestampFormat: TimestampFormat.ISO_8601,
    });
  });

  it("throws if client_id isn't found", () => {
    process.env._CHALK_API_SERVER = "http://localhost:8000";
    process.env._CHALK_CLIENT_SECRET = "secret";

    expect(() => {
      new ChalkClient();
    }).toThrow();
  });

  it("throws if client_secret isn't found", () => {
    process.env._CHALK_API_SERVER = "http://localhost:8000";
    process.env._CHALK_CLIENT_ID = "client_id";

    expect(() => {
      new ChalkClient();
    }).toThrow();
  });
});

describe("ChalkClientWithCustomHeaders", () => {
  it("should have headers if you set them by setting a custom fetchHeaders arg", async () => {
    let exfiltratedHeaders: HeadersInit | undefined = undefined;
    const injectedFetch = (req: any, init: RequestInit | undefined): any => {
      exfiltratedHeaders = init?.headers;
      return Promise.resolve({
        status: 200,
        json: () => ({
          data: [
            {
              field: "user.id",
              value: "injected!",
              ts: "2023-01-01",
            },
          ],
        }),
      });
    };
    class FetchHeadersTest extends isoHeaders {
      constructor(init?: HeadersInit) {
        super(init);
        Object.entries({ "test-header-key": "test-header-value" }).forEach(
          ([key, value]) => {
            this.append(key, value);
          }
        );
      }
    }
    const client = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
      fetchHeaders: FetchHeadersTest,
    });

    const result = await client.query({
      inputs: { "user.id": 1 },
      outputs: ["user.id"],
    });
    const headersMap: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap[key] = value;
    });
    expect(headersMap["test-header-key"]).toBe("test-header-value");
    expect(result.data["user.id"].value).toBe("injected!");
  });

  it("should respect headers passed to the client", async () => {
    let exfiltratedHeaders: HeadersInit | undefined = undefined;
    const injectedFetch = (req: any, init: RequestInit | undefined): any => {
      exfiltratedHeaders = init?.headers;
      return Promise.resolve({
        status: 200,
        json: () => ({
          data: [
            {
              field: "user.id",
              value: "injected!",
              ts: "2023-01-01",
            },
          ],
        }),
      });
    };

    const client = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
      additionalHeaders: {
        "client-additional-header-one": "value-one",
        "client-additional-header-two": "value-two",
      },
    });

    const result = await client.query({
      inputs: { "user.id": 1 },
      outputs: ["user.id"],
    });
    const headersMap: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap[key] = value;
    });
    expect(headersMap["client-additional-header-one"]).toBe("value-one");
    expect(headersMap["client-additional-header-two"]).toBe("value-two");
    expect(result.data["user.id"].value).toBe("injected!");
  });

  it("should respect headers passed in individual requests and override client headers", async () => {
    let exfiltratedHeaders: HeadersInit | undefined = undefined;
    const injectedFetch = (req: any, init: RequestInit | undefined): any => {
      exfiltratedHeaders = init?.headers;
      return Promise.resolve({
        status: 200,
        json: () => ({
          data: [
            {
              field: "user.id",
              value: "injected!",
              ts: "2023-01-01",
            },
          ],
        }),
      });
    };

    const client = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
      additionalHeaders: {
        "client-additional-header-one": "value-one",
        "client-additional-header-two": "value-two",
        "header-to-overwrite": "client-value",
      },
    });

    const result = await client.query(
      {
        inputs: { "user.id": 1 },
        outputs: ["user.id"],
      },
      {
        additionalHeaders: {
          "header-to-overwrite": "request-value",
          "request-header-one": "value-one",
        },
      }
    );
    const headersMap: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap[key] = value;
    });
    expect(headersMap["client-additional-header-one"]).toBe("value-one");
    expect(headersMap["client-additional-header-two"]).toBe("value-two");
    expect(headersMap["header-to-overwrite"]).toBe("request-value");
    expect(headersMap["request-header-one"]).toBe("value-one");
    expect(result.data["user.id"].value).toBe("injected!");
  });

  it("should respect the precedence of env headers", async () => {
    let exfiltratedHeaders: HeadersInit | undefined = undefined;
    const injectedFetch = (req: any, init: RequestInit | undefined): any => {
      exfiltratedHeaders = init?.headers;
      return Promise.resolve({
        status: 200,
        json: () => ({
          data: [
            {
              field: "user.id",
              value: "injected!",
              ts: "2023-01-01",
            },
          ],
        }),
      });
    };

    const client = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
      activeEnvironment: "my-environment",
      additionalHeaders: {
        "client-additional-header-one": "value-one",
        "client-additional-header-two": "value-two",
        "header-to-overwrite": "client-value",
      },
    });

    const result = await client.query(
      {
        inputs: { "user.id": 1 },
        outputs: ["user.id"],
      },
      {
        additionalHeaders: {
          "header-to-overwrite": "request-value",
          "request-header-one": "value-one",
        },
      }
    );
    const headersMap: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap[key] = value;
    });
    expect(headersMap["client-additional-header-one"]).toBe("value-one");
    expect(headersMap["client-additional-header-two"]).toBe("value-two");
    expect(headersMap["header-to-overwrite"]).toBe("request-value");
    expect(headersMap["request-header-one"]).toBe("value-one");
    expect(headersMap["x-chalk-env-id"]).toBe("my-environment");
    expect(result.data["user.id"].value).toBe("injected!");
  });

  it("should respect the precedence of env headers", async () => {
    let exfiltratedHeaders: HeadersInit | undefined = undefined;
    const injectedFetch = (req: any, init: RequestInit | undefined): any => {
      if (req.endsWith("/v1/oauth/token")) {
        return Promise.resolve({
          status: 200,
          json: () => ({
            access_token: "test-access-token",
            token_type: "test-access-token-type",
            primary_environment: "server-creds-environment",
            expires_in: 99999,
            engines: {},
          }),
        });
      }
      exfiltratedHeaders = init?.headers;
      return Promise.resolve({
        status: 200,
        json: () => ({
          data: [
            {
              field: "user.id",
              value: "injected!",
              ts: "2023-01-01",
            },
          ],
        }),
      });
    };

    const client = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
    });

    const _ = await client.query({
      inputs: { "user.id": 1 },
      outputs: ["user.id"],
    });
    const headersMap1: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap1[key] = value;
    });
    expect(headersMap1["x-chalk-env-id"]).toBe("server-creds-environment");

    const clientWithEnv = new ChalkClient<any>({
      clientId: "hello",
      clientSecret: "test",
      fetch: injectedFetch,
      activeEnvironment: "client-environment",
    });

    const __ = await clientWithEnv.query(
      {
        inputs: { "user.id": 1 },
        outputs: ["user.id"],
      },
      {
        additionalHeaders: {
          "request-header-one": "value-one",
        },
      }
    );
    const headersMap2: { [index: string]: string } = {};
    (exfiltratedHeaders as any).forEach((value: string, key: string) => {
      headersMap2[key] = value;
    });
    expect(headersMap2["x-chalk-env-id"]).toBe("client-environment");
  });
});
