import { ChalkClient } from "../_client";

interface FraudTemplateFeatures {
  "user.id": number;
  "user.gender": "m" | "f" | "x";
  "user.socure_score": number;
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
  });

  afterAll(() => {
    client.flushTraces();
  });
});
