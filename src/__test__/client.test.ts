import { ChalkClient } from "../_client";
import { DEFAULT_API_SERVER } from "../_const";
import { ChalkClientConfig } from "../_types";

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
      clientId: "c",
      clientSecret: "d",
    });

    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: "a",
      apiServer: "b",
      clientId: "c",
      clientSecret: "d",
    });
  });

  it("reads from environment variables when set", () => {
    process.env._CHALK_ACTIVE_ENVIRONMENT = "env";
    process.env._CHALK_API_SERVER = "http://localhost:8000";
    process.env._CHALK_CLIENT_ID = "client_id";
    process.env._CHALK_CLIENT_SECRET = "secret";

    const client = new ChalkClient();

    expect(getConfig(client)).toEqual<ChalkClientConfig>({
      activeEnvironment: "env",
      apiServer: "http://localhost:8000",
      clientId: "client_id",
      clientSecret: "secret",
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
      clientId: "client_id",
      clientSecret: "secret",
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
