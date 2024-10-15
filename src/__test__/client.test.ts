import { ChalkClient } from "../_client";
import { DEFAULT_API_SERVER } from "../_const";
import { ChalkClientConfig } from "../_types";
import { TimestampFormat } from "../_interface";

function getConfig(client: ChalkClient): ChalkClientConfig {
  return (client as any).config;
}

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
