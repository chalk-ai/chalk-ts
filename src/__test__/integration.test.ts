import { ChalkClient } from "../_client";

interface FraudTemplateFeatures {
  "user.id": number;
  "user.full_name": string;
  "user.gender": "m" | "f" | "x";
  "user.socure_score": number;

  "transaction.id": number;
  "transaction.amount": number;
  "transaction.user.full_name": string;

  "bag_of_stuff.id": number;
  "bag_of_stuff.f1": string;
  "bag_of_stuff.f2": string;
}

const maybe = Boolean(process.env.CHALK_INTEGRATION) ? describe : describe.skip;

maybe("integration tests", () => {
  let client: ChalkClient;
  beforeAll(() => {
    client = new ChalkClient<FraudTemplateFeatures>({
      clientId: process.env.CI_CHALK_CLIENT_ID,
      clientSecret: process.env.CI_CHALK_CLIENT_SECRET,
    });
  });

  beforeEach(() => {
    // Cold-starts for a preview deployment can be slow, so we allow a very generous timeout
    // for all of our outbound network calls
    jest.setTimeout(30_000);
  });

  describe("test queryServer", () => {
    it("should override the default server but only for queries", async () => {
      let urlFromFetch = null;
      const injectedFetch = async (req: any, init: any): Promise<any> => {
        urlFromFetch = req;
        return await fetch(req, init);
      };

      const queryServerClient = new ChalkClient<FraudTemplateFeatures>({
        clientId: process.env.CI_CHALK_CLIENT_ID,
        clientSecret: process.env.CI_CHALK_CLIENT_SECRET,
        queryServer: "https://my-test-url",
        fetch: injectedFetch,
      });

      const whoami = await queryServerClient.whoami();

      expect(whoami).toHaveProperty("user");
      expect(whoami).toHaveProperty("environment_id");
      expect(whoami).toHaveProperty("team_id");

      try {
        await queryServerClient.query({
          inputs: {
            "user.id": 1,
          },
          outputs: ["user.full_name"],
        });
      } catch (e) {}

      expect(urlFromFetch).toEqual("https://my-test-url/v1/query/online");
    });
  });

  describe("test bad credentials", () => {
    it("should raise an error with bad creds", async () => {
      // can't seem to do expect().toThrow with async functions
      let error = null;
      try {
        const badClient = new ChalkClient<FraudTemplateFeatures>({
          clientId: "bogus",
          clientSecret: "bogus",
        });
        const results = await badClient.query({
          inputs: {
            "user.id": 1,
          },
          outputs: ["user.full_name"],
        });
        console.log(results);
      } catch (e) {
        error = e;
      }
      expect((error as any).message).toEqual(
        `{"detail":"Client ID and secret invalid","message":"Client ID and secret invalid","trace":null}\n`
      );
    });

    it("should raise an error with bad creds for bulk query", async () => {
      let error = null;
      try {
        const badClient = new ChalkClient<FraudTemplateFeatures>({
          clientId: "bogus",
          clientSecret: "bogus",
        });
        const results = await badClient.queryBulk({
          inputs: {
            "user.id": [1, 2],
          },
          outputs: ["user.full_name"],
        });
        console.log(results);
      } catch (e) {
        error = e;
      }
      expect((error as any).message).toEqual(
        `{"detail":"Client ID and secret invalid","message":"Client ID and secret invalid","trace":null}\n`
      );
    });

    it("should raise an error with NO creds for bulk query", async () => {
      let error = null;
      try {
        const badClient = new ChalkClient<FraudTemplateFeatures>();
        const results = await badClient.queryBulk({
          inputs: {
            "user.id": [1, 2],
          },
          outputs: ["user.full_name"],
        });
        console.log(results);
      } catch (e) {
        error = e;
      }
      expect((error as any).message).toEqual(
        `Chalk client parameter 'clientSecret' was not specified when creating your ChalkClient, and was not present as '_CHALK_CLIENT_SECRET' in process.env. This field is required to use Chalk`
      );
    });
  });

  describe("query with injected fetch", () => {
    it("should use the injected fetch client", async () => {
      // sneak a fetch in that returns a recognizable response
      const injectedFetch = (req: any, init: any): any =>
        Promise.resolve({
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

      const injectedClient = new ChalkClient<FraudTemplateFeatures>({
        clientId: process.env.CI_CHALK_CLIENT_ID,
        clientSecret: process.env.CI_CHALK_CLIENT_SECRET,
        fetch: injectedFetch,
      });

      const result = await injectedClient.query({
        inputs: { "user.id": 1 },
        outputs: ["user.id"],
      });
      expect(result.data["user.id"].value).toBe("injected!");
    });
  });

  describe("query fraud-template", () => {
    it("query user.id", async () => {
      const result = await client.query({
        inputs: {
          "user.id": 1,
        },
        outputs: ["user.id"],
      });

      expect(result.data["user.id"].value).toBe(1);
    });

    it("query user.gender", async () => {
      const result = await client.query({
        inputs: {
          "user.id": 1,
        },
        outputs: ["user.gender"],
      });

      expect(result.data["user.gender"].value).toBe("f");
    });

    it("query user.id and user.gender", async () => {
      const result = await client.query({
        inputs: {
          "user.id": 2,
        },
        outputs: ["user.id", "user.gender"],
      });

      expect(Object.keys(result.data).length).toBe(2);
      expect(result.data["user.id"].value).toBe(2);
      expect(result.data["user.gender"].value).toBe("f");
    });

    it("query alternate struct encodings", async () => {
      const result = await client.query({
        inputs: {
          "user.id": 1,
        },
        outputs: ["user.id", "user.franchise_set"],
        encodingOptions: {
          encodeStructsAsObjects: true,
        },
      });

      expect(Object.keys(result.data).length).toBe(2);
      expect(result.data["user.id"].value).toBe(1);
      expect(
        (result.data["user.franchise_set"].value as any)["locations"][0]
      ).toEqual({
        coordinates: [
          {
            lat: 41.9,
            lng: 71.9,
          },
          {
            lat: 42.8,
            lng: 72.8,
          },
        ],
        latlng: {
          lat: 42,
          lng: 71,
        },
        owners: ["Alice", "Bob"],
      });
    });

    it("query_bulk fraud template", async () => {
      const result = await client.queryBulk({
        inputs: {
          "user.id": [1, 2],
        },
        outputs: ["user.id", "user.full_name"],
        encodingOptions: {
          encodeStructsAsObjects: true,
        },
      });

      expect(Object.keys(result.data).length).toBe(2);
      expect(result.data[0]["user.id"]).toEqual(1);
      expect(result.data[0]["user.full_name"]).toEqual("Donna Davis");
      expect(result.data[1]["user.id"]).toEqual(2);
      expect(result.data[1]["user.full_name"]).toEqual("William Johnson");

      expect(result.meta).toBeDefined();
    });

    it("multi_query fraud template", async () => {
      const result = await client.multiQuery({
        queries: [
          {
            inputs: { "user.id": [1, 2] },
            outputs: ["user.id", "user.full_name", "user.gender"],
          },
          {
            inputs: { "transaction.id": [1, 2, 3, 4] },
            outputs: ["transaction.amount", "transaction.user.full_name"],
          },
          {
            inputs: { "bag_of_stuff.id": [1, 2, 3, 4, 5, 6, 7, 8] },
            outputs: ["bag_of_stuff.f1", "bag_of_stuff.f2"],
          },
          {
            inputs: { "user.id": [1] },
            outputs: ["user.absolutely_bogus_feature_doesnt_exist" as any],
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
      expect(fourth.meta?.queryHash).toBeNull();

      expect(first.meta).toHaveProperty("executionDurationS");
      expect(first.meta).toHaveProperty("deploymentId");
      expect(first.meta).toHaveProperty("environmentId");
      expect(first.meta).toHaveProperty("environmentName");
      expect(first.meta).toHaveProperty("queryId");
      expect(first.meta).toHaveProperty("queryTimestamp");
      expect(first.meta).toHaveProperty("queryHash");
      expect(first.meta).toHaveProperty("explainOutput");

      expect(first.errors).toBeUndefined();
      expect(second.errors).toBeUndefined();
      expect(third.errors).toBeUndefined();
      expect(fourth.errors).toBeDefined();
      expect(fourth.errors?.length).toEqual(1);

      expect(first.data[0]["user.full_name"]).toEqual("Donna Davis");
      expect(first.data[1]["user.full_name"]).toEqual("William Johnson");

      expect(second.data[0]["transaction.user.full_name"]).toEqual(
        "Norma Fisher"
      );
      expect(second.data[0]["transaction.amount"]).toEqual(623);

      expect(third.data[7]["bag_of_stuff.f1"]).toEqual("f1");

      expect(fourth.errors?.[0].code).toEqual("PARSE_FAILED");
      expect(fourth.errors?.[0].message).toEqual(
        "Query output referenced undefined feature 'user.absolutely_bogus_feature_doesnt_exist'"
      );
      expect(fourth.errors?.[0].feature).toEqual(
        "user.absolutely_bogus_feature_doesnt_exist"
      );
      expect(fourth.errors?.[0].category).toEqual("REQUEST");
    });
  });
});
