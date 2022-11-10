import { ChalkClient } from "../_client";

interface FraudTemplateFeatures {
  "user.id": number;
  "user.gender": "m" | "f" | "x";
  "user.socure_score": number;
}

const maybe = Boolean(process.env.CHALK_INTEGRATION)
  ? describe
  : describe.skip;

maybe("integration tests", () => {
  it("query fraud-template user.id=1", async () => {
    console.log(
      "clientId",
      (process.env.CI_CHALK_CLIENT_ID ?? "").substring(0, 2)
    );

    const client = new ChalkClient<FraudTemplateFeatures>({
      clientId: process.env.CI_CHALK_CLIENT_ID,
      clientSecret: process.env.CI_CHALK_CLIENT_SECRET,
    });

    const result = await client.query({
      inputs: {
        "user.id": 1,
      },
      outputs: ["user.id"],
    });

    expect(result.data["user.id"]).toBe(1);
  });
});
