import { ChalkClient } from "../_client";

interface FraudTemplateFeatures {
  "user.id": number;
  "user.gender": "m" | "f" | "x";
  "user.socure_score": number;
}

describe("integration", () => {
  it("query fraud-template user.id=1", async () => {
    const client = new ChalkClient<FraudTemplateFeatures>({
      clientId: process.env.CHALK_CLIENT_ID,
      clientSecret: process.env.CHALK_CLIENT_SECRET,
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
