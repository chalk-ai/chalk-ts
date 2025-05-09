import { ChalkClient } from "../_client_http";

describe("ChalkClient getQueryServer", () => {
  const injectedFetch = (req: any, init: RequestInit | undefined): any => {
    if (req.endsWith("/v1/oauth/token")) {
      return Promise.resolve({
        status: 200,
        json: () => ({
          access_token: "test-access-token",
          token_type: "test-access-token-type",
          primary_environment: "server-creds-environment",
          expires_in: 99999,
          engines: { not_a_real_environment: "query_server_from_credentials" },
        }),
      });
    }
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

  it("Should use the query server passed in as an argument if available", async () => {
    const client = new ChalkClient({
      clientId: "not_a_real_client",
      clientSecret: "not_a_real_client_secret",
      apiServer: "not_a_real_api_server",
      queryServer: "not_a_real_query_server",
      fetch: injectedFetch,
    });

    const queryServer = await client.getQueryServer();

    expect(queryServer).toBe("not_a_real_query_server");
  });

  it("Should fall back to the api server passed in as an argument if available", async () => {
    const client = new ChalkClient({
      clientId: "not_a_real_client",
      clientSecret: "not_a_real_client_secret",
      apiServer: "not_a_real_api_server",
      fetch: injectedFetch,
    });

    const queryServer = await client.getQueryServer();

    expect(queryServer).toBe("not_a_real_api_server");
  });

  it("Should use the engine credentials if the option is passed ", async () => {
    const client = new ChalkClient({
      clientId: "not_a_real_client",
      clientSecret: "not_a_real_client_secret",
      apiServer: "not_a_real_api_server",
      useQueryServerFromCredentialExchange: true,
      activeEnvironment: "not_a_real_environment",
      fetch: injectedFetch,
    });

    const queryServer = await client.getQueryServer();

    expect(queryServer).toBe("query_server_from_credentials");
  });

  it("Should ignore the engine credentials if the engine is not present", async () => {
    const client = new ChalkClient({
      clientId: "not_a_real_client",
      clientSecret: "not_a_real_client_secret",
      apiServer: "not_a_real_api_server",
      useQueryServerFromCredentialExchange: true,
      activeEnvironment: "not_a_real_environment_2",
      fetch: injectedFetch,
    });

    const queryServer = await client.getQueryServer();

    expect(queryServer).toBe("not_a_real_api_server");
  });
});
