import { StructRow } from "apache-arrow";
import * as fs from "fs";
import * as path from "path";
import { parseByteModel, parseFeatherQueryResponse } from "../_bulk_response";

describe("parseByteModel", () => {
  it("should produce the expected keys", () => {
    const bytes = fs.readFileSync(
      path.resolve(__dirname, "binaries/first.bytes")
    );

    const output = parseByteModel(bytes);

    expect(Object.keys(output)).toEqual([
      "attrs",
      "pydantic",
      "attrAndByteOffset",
      "concatenatedByteObjects",
      "attrAndByteOffsetForSerializables",
      "concatenatedSerializableByteObjects",
    ]);
  });
});

describe("parseFeatherQueryResponse", () => {
  it("should handle a multi-query feather response", () => {
    const multi_bytes = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_multi.bytes")
    );
    const multiData = parseFeatherQueryResponse(multi_bytes);
    expect(multiData.length).toBe(2);
    expect((multiData[0].data as StructRow[]).map((d) => d.toJSON())).toEqual([
      {
        "user.random_normal": -2.504300832748413,
        "user.full_name": "Donna Davis",
        "user.id": 1,
        "user.__chalk_observed_at__": 1712708210149.395,
        __ts__: 1712708210149.395,
      },
      {
        "user.random_normal": -1.4988536834716797,
        "user.full_name": "William Johnson",
        "user.id": 2,
        "user.__chalk_observed_at__": 1712708210149.395,
        __ts__: 1712708210149.395,
      },
      {
        "user.random_normal": 1.758903980255127,
        "user.full_name": "Jasmine Perry",
        "user.id": 3,
        "user.__chalk_observed_at__": 1712708210149.395,
        __ts__: 1712708210149.395,
      },
      {
        "user.random_normal": 1.3693839311599731,
        "user.full_name": "Matthew Roth",
        "user.id": 4,
        "user.__chalk_observed_at__": 1712708210149.395,
        __ts__: 1712708210149.395,
      },
    ]);
    expect(multiData[0].meta).toEqual({
      execution_duration_s: 0.84107918899997,
      deployment_id: "clusuova000050ms659jbbklg",
      environment_id: "tmnmwqtcbscbd",
      environment_name: "dev",
      query_id: "clut28wrt00110js6ygjq3lh4",
      query_timestamp: "2024-04-10T00:16:50.149395+00:00",
      query_hash:
        "354c5201ef4248bbc78810f4d987d506d5fa3b98ee2579b7f715896a96e080e5",
      explain_output: null,
    });
    expect(multiData[0].errors?.length).toEqual(0);

    expect((multiData[1].data as StructRow[]).map((d) => d.toJSON())).toEqual([
      {
        "transaction.amount": 623,
        "transaction.user.full_name": "Norma Fisher",
        "transaction.id": 1,
        "transaction.ts": 1675322153833.177,
        __ts__: 1712708210149.395,
      },
      {
        "transaction.amount": 597,
        "transaction.user.full_name": "Norma Fisher",
        "transaction.id": 2,
        "transaction.ts": 1674313291406.393,
        __ts__: 1712708210149.395,
      },
      {
        "transaction.amount": 514,
        "transaction.user.full_name": "Norma Fisher",
        "transaction.id": 3,
        "transaction.ts": 1675490035989.8472,
        __ts__: 1712708210149.395,
      },
      {
        "transaction.amount": 902,
        "transaction.user.full_name": "Norma Fisher",
        "transaction.id": 4,
        "transaction.ts": 1677039917026.701,
        __ts__: 1712708210149.395,
      },
    ]);

    expect(multiData[1].meta).toEqual({
      execution_duration_s: 1.2813234230000035,
      deployment_id: "clusuova000050ms659jbbklg",
      environment_id: "tmnmwqtcbscbd",
      environment_name: "dev",
      query_id: "clut28ws200120js64ydzykju",
      query_timestamp: "2024-04-10T00:16:50.149395+00:00",
      query_hash:
        "38c05bd2ead10b4c8a11d00e8e2df128952eec32ed073e53ff83980259f2308d",
      explain_output: null,
    });

    expect(multiData[1].errors?.length).toEqual(0);
  });

  it("should handle a single-query feather response", () => {
    const single_bytes = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_single.bytes")
    );
    const singleData = parseFeatherQueryResponse(single_bytes);
    expect(singleData.length).toBe(1);
    expect((singleData[0].data as StructRow[]).map((d) => d.toJSON())).toEqual([
      {
        "user.random_normal": 2.376134157180786,
        "user.full_name": "Donna Davis",
        "user.id": 1,
        "user.__chalk_observed_at__": 1712708264809.198,
        __ts__: 1712708264809.198,
      },
      {
        "user.random_normal": -1.5992772579193115,
        "user.full_name": "William Johnson",
        "user.id": 2,
        "user.__chalk_observed_at__": 1712708264809.198,
        __ts__: 1712708264809.198,
      },
      {
        "user.random_normal": -0.29425880312919617,
        "user.full_name": "Jasmine Perry",
        "user.id": 3,
        "user.__chalk_observed_at__": 1712708264809.198,
        __ts__: 1712708264809.198,
      },
      {
        "user.random_normal": -0.15812711417675018,
        "user.full_name": "Matthew Roth",
        "user.id": 4,
        "user.__chalk_observed_at__": 1712708264809.198,
        __ts__: 1712708264809.198,
      },
    ]);
    expect(singleData[0].meta).toEqual({
      execution_duration_s: 0.8231708729999809,
      deployment_id: "clusuova000050ms659jbbklg",
      environment_id: "tmnmwqtcbscbd",
      environment_name: "dev",
      query_id: "clut2a2y400150js6qeyml6n9",
      query_timestamp: "2024-04-10T00:17:44.809198+00:00",
      query_hash:
        "354c5201ef4248bbc78810f4d987d506d5fa3b98ee2579b7f715896a96e080e5",
      explain_output: null,
    });
    expect(singleData[0].errors?.length).toEqual(0);
  });

  it("should handle a multi-query feather response with errors in one response", () => {
    const multi_bytes_error = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_multi_error.bytes")
    );
    const multiDataErrors = parseFeatherQueryResponse(multi_bytes_error);

    expect(multiDataErrors.length).toBe(2);

    expect(
      (multiDataErrors[0].data as StructRow[]).map((d) => d.toJSON())
    ).toEqual([
      {
        "user.random_normal": -0.6867642402648926,
        "user.full_name": "Donna Davis",
        "user.id": 1,
        "user.__chalk_observed_at__": 1712708226312.231,
        __ts__: 1712708226312.231,
      },
      {
        "user.random_normal": -1.0890105962753296,
        "user.full_name": "William Johnson",
        "user.id": 2,
        "user.__chalk_observed_at__": 1712708226312.231,
        __ts__: 1712708226312.231,
      },
      {
        "user.random_normal": -0.18598082661628723,
        "user.full_name": "Jasmine Perry",
        "user.id": 3,
        "user.__chalk_observed_at__": 1712708226312.231,
        __ts__: 1712708226312.231,
      },
      {
        "user.random_normal": -0.10236824303865433,
        "user.full_name": "Matthew Roth",
        "user.id": 4,
        "user.__chalk_observed_at__": 1712708226312.231,
        __ts__: 1712708226312.231,
      },
    ]);

    expect(multiDataErrors[0].meta).toEqual({
      execution_duration_s: 0.4206589800000984,
      deployment_id: "clusuova000050ms659jbbklg",
      environment_id: "tmnmwqtcbscbd",
      environment_name: "dev",
      query_id: "clut2998t00130js64i9m9f6r",
      query_timestamp: "2024-04-10T00:17:06.312231+00:00",
      query_hash:
        "354c5201ef4248bbc78810f4d987d506d5fa3b98ee2579b7f715896a96e080e5",
      explain_output: null,
    });

    expect(multiDataErrors[1].data.length).toBe(0);

    expect(multiDataErrors[1].meta).toEqual({
      execution_duration_s: 0,
      deployment_id: "clusuova000050ms659jbbklg",
      environment_id: "tmnmwqtcbscbd",
      environment_name: null,
      query_id: "clut2999000140js6tgsb0009",
      query_timestamp: "2024-04-10T00:17:06.312231+00:00",
      query_hash: null,
      explain_output: null,
    });

    expect(multiDataErrors[1].errors?.length).toBe(1);

    expect(multiDataErrors[1].errors?.[0]).toEqual({
      code: "PARSE_FAILED",
      category: "REQUEST",
      message:
        "Query output referenced undefined feature 'transaction.amount, transaction.user.full_name'",
      display_primary_key: null,
      display_primary_key_fqn: null,
      exception: null,
      feature: "transaction.amount, transaction.user.full_name",
      resolver: null,
    });
  });

  it("should fail on compressed response; compression not implemented in arrow", () => {
    const single_bytes_compressed = fs.readFileSync(
      path.resolve(__dirname, "binaries/first.bytes")
    );

    const tryToParseCompressed = () =>
      parseFeatherQueryResponse(single_bytes_compressed);

    expect(tryToParseCompressed).toThrow(
      "Record batch compression not implemented"
    );
  });
});
