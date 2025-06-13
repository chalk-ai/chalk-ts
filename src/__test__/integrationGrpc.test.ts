import { ChalkGRPCClient } from "../_client_grpc";

interface IntegrationTestFeatures {
  "all_types.id": number;
  "all_types.int_feat": bigint;
  "all_types.str_feat": string;
  "all_types.has_one": { all_types_id: number; id: string };
  "all_types.has_many": { all_types_id: number; id: string }[];

  "all_types.not_a_real_feat": string;
}

const maybe = Boolean(process.env.CHALK_INTEGRATION) ? describe : describe.skip;
const INTEGRATION_TEST_TIMEOUT = 30_000; // 30s

maybe("integration tests (gRPC)", () => {
  let client: ChalkGRPCClient<IntegrationTestFeatures>;
  beforeAll(() => {
    client = new ChalkGRPCClient<IntegrationTestFeatures>({
      clientId: process.env._INTEGRATION_TEST_CLIENT_ID,
      clientSecret: process.env._INTEGRATION_TEST_CLIENT_SECRET,
      apiServer: process.env._INTEGRATION_TEST_API_SERVER,
      activeEnvironment: process.env._INTEGRATION_TEST_ACTIVE_ENVIRONMENT,
    });
  });

  beforeEach(() => {
    // Cold-starts for a preview deployment can be slow, so we allow a very generous timeout
    // for all of our outbound network calls
    jest.setTimeout(INTEGRATION_TEST_TIMEOUT);
  });

  describe("test bad credentials", () => {
    it(
      "should raise an error with bad creds",
      async () => {
        // can't seem to do expect().toThrow with async functions
        let error = null;
        try {
          const badClient = new ChalkGRPCClient<IntegrationTestFeatures>({
            clientId: "bogus",
            clientSecret: "bogus",
          });
          const results = await badClient.query({
            inputs: {
              "all_types.id": 1,
            },
            outputs: ["all_types.str_feat"],
          });
        } catch (e) {
          error = e;
        }
        expect((error as any).message).toEqual(
          `{"detail":"Client ID and secret are invalid","message":"Client ID and secret are invalid","trace":null}\n`
        );
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "should raise an error with bad creds for bulk query",
      async () => {
        let error = null;
        try {
          const badClient = new ChalkGRPCClient<IntegrationTestFeatures>({
            clientId: "bogus",
            clientSecret: "bogus",
          });
          await badClient.queryBulk({
            inputs: {
              "all_types.id": [1, 2],
            },
            outputs: ["all_types.str_feat"],
          });
        } catch (e) {
          error = e;
        }
        expect((error as any).message).toEqual(
          `{"detail":"Client ID and secret are invalid","message":"Client ID and secret are invalid","trace":null}\n`
        );
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "should raise an error with NO creds for bulk query",
      async () => {
        let error = null;
        try {
          const badClient = new ChalkGRPCClient<IntegrationTestFeatures>();
          await badClient.queryBulk({
            inputs: {
              "all_types.id": [1, 2],
            },
            outputs: ["all_types.str_feat"],
          });
        } catch (e) {
          error = e;
        }
        expect((error as any).message).toEqual(
          `Chalk client parameter 'clientId' was not specified when creating your ChalkClient, and was not present as '_CHALK_CLIENT_ID' in process.env. This field is required to use Chalk`
        );
      },
      INTEGRATION_TEST_TIMEOUT
    );
  });

  describe("automatic query server detection", () => {
    it(
      "query all_types.int_feat with no set active environment (uses credential exchange)",
      async () => {
        client = new ChalkGRPCClient<IntegrationTestFeatures>({
          clientId: process.env._INTEGRATION_TEST_CLIENT_ID,
          clientSecret: process.env._INTEGRATION_TEST_CLIENT_SECRET,
          apiServer: process.env._INTEGRATION_TEST_API_SERVER,
        });

        const result = await client.query({
          inputs: {
            "all_types.id": 1,
          },
          outputs: ["all_types.int_feat"],
        });

        expect(Number(result.data["all_types.int_feat"].value)).toBe(1);
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "query all_types.int_feat with no set active environment (uses environment variables)",
      async () => {
        process.env._CHALK_ACTIVE_ENVIRONMENT =
          process.env._INTEGRATION_TEST_ACTIVE_ENVIRONMENT;
        client = new ChalkGRPCClient<IntegrationTestFeatures>({
          clientId: process.env._INTEGRATION_TEST_CLIENT_ID,
          clientSecret: process.env._INTEGRATION_TEST_CLIENT_SECRET,
          apiServer: process.env._INTEGRATION_TEST_API_SERVER,
        });

        const result = await client.query({
          inputs: {
            "all_types.id": 1,
          },
          outputs: ["all_types.int_feat"],
        });

        expect(Number(result.data["all_types.int_feat"].value)).toBe(1);
        process.env._CHALK_ACTIVE_ENVIRONMENT = undefined;
      },
      INTEGRATION_TEST_TIMEOUT
    );
  });

  describe("query integration_tests", () => {
    it(
      "query all_types.int_feat",
      async () => {
        const result = await client.query({
          inputs: {
            "all_types.id": 1,
          },
          outputs: ["all_types.int_feat"],
        });

        expect(Number(result.data["all_types.int_feat"].value)).toBe(1);
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "query all_types.str_feat and all_types.int_feat",
      async () => {
        const result = await client.query({
          inputs: {
            "all_types.id": 1,
          },
          outputs: ["all_types.str_feat", "all_types.int_feat"],
        });

        expect(result.data["all_types.str_feat"].value).toBe("1");
        expect(Number(result.data["all_types.int_feat"].value)).toBe(1);
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "query_bulk integration_tests",
      async () => {
        const result = await client.queryBulk({
          inputs: {
            "all_types.id": [1, 2],
          },
          outputs: ["all_types.str_feat"],
          encodingOptions: {
            encodeStructsAsObjects: true,
          },
          queryName: "chalk-ts query_bulk integration_tests",
        });

        expect(Object.keys(result.data).length).toBe(2);
        expect(result.data[0]["all_types.str_feat"]).toEqual("1");
        expect(result.data[1]["all_types.str_feat"]).toEqual("2");

        expect(result.meta).toBeDefined();
      },
      INTEGRATION_TEST_TIMEOUT
    );

    it(
      "multi_query integration_tests",
      async () => {
        const result = await client.multiQuery({
          queries: [
            {
              inputs: { "all_types.id": [1, 2] },
              outputs: ["all_types.str_feat"],
            },
            {
              inputs: { "all_types.id": [1, 2, 3, 4] },
              outputs: ["all_types.int_feat"],
            },
            {
              inputs: { "all_types.id": [1, 2, 3, 4, 5, 6, 7, 8] },
              outputs: ["all_types.str_feat"],
            },
            {
              inputs: { "all_types.id": [1] },
              outputs: ["all_types.not_a_real_feat"],
            },
          ],
          queryName: "chalk-ts-multi-query-test",
          encodingOptions: {
            encodeStructsAsObjects: true,
          },
        });

        expect(result.responses.length).toBe(4);

        const first = result.responses[0];
        const second = result.responses[1];
        const third = result.responses[2];
        const fourth = result.responses[3];

        expect(first.data.length).toBe(2);
        expect(second.data.length).toBe(4);
        expect(third.data.length).toBe(8);
        expect(fourth.data.length).toBe(0);

        expect(first.meta).toBeDefined();
        expect(second.meta).toBeDefined();
        expect(third.meta).toBeDefined();
        expect(fourth.meta).toBeDefined();

        expect(first.meta?.queryHash).toBeDefined();
        expect(second.meta?.queryHash).toBeDefined();
        expect(third.meta?.queryHash).toBeDefined();

        expect(first.meta).toHaveProperty("executionDurationS");
        expect(first.meta).toHaveProperty("deploymentId");
        expect(first.meta).toHaveProperty("environmentId");
        expect(first.meta).toHaveProperty("environmentName");
        expect(first.meta).toHaveProperty("queryId");
        expect(first.meta).toHaveProperty("queryTimestamp");
        expect(first.meta).toHaveProperty("queryHash");
        expect(first.meta).toHaveProperty("explainOutput");

        expect(first.errors?.length || 0).toBe(0);
        expect(second.errors?.length || 0).toBe(0);
        expect(third.errors?.length || 0).toBe(0);
        expect(fourth.errors?.length).toEqual(1);

        expect(fourth.errors?.[0].code).toEqual("PARSE_FAILED");
        expect(fourth.errors?.[0].message).toEqual(
          "Query output referenced undefined feature 'all_types.not_a_real_feat'"
        );
        expect(fourth.errors?.[0].feature).toEqual("all_types.not_a_real_feat");
        expect(fourth.errors?.[0].category).toEqual("REQUEST");
      },
      INTEGRATION_TEST_TIMEOUT
    );
  });
});
