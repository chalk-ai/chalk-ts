import { tableFromIPC } from "apache-arrow";
import * as fs from "fs";
import * as path from "path";
import { MULTI_QUERY_MAGIC_STR } from "../_bulk_response";
import {
  featherRequestHeaderFromBody,
  IntermediateRequestBodyJSON,
  serializeMultipleQueryInputFeather,
} from "../_feather";

describe("featherRequestHeaderFromBody", () => {
  const body1: IntermediateRequestBodyJSON<
    { foo: number; bar: string },
    "bar" | "foo"
  > = {
    inputs: { foo: [2, 4, 6, 8, 10, 12] },
    outputs: ["bar"],
    query_name: "Rutherford",
    correlation_id: "abcd_efg_hijk_elemenop",
    staleness: {
      bar: "1h",
    },
  };

  it("should include the feather fields", () => {
    const header = featherRequestHeaderFromBody(body1);

    expect(header).toMatchObject({
      outputs: ["bar"],
      query_name: "Rutherford",
      correlation_id: "abcd_efg_hijk_elemenop",
      staleness: {
        bar: "1h",
      },
      feather_body_type: "RECORD_BATCHES",
      response_compression_scheme: "uncompressed",
      client_supports_64bit: false,
    });
  });

  it("should exclude the inputs field", () => {
    const header = featherRequestHeaderFromBody(body1);

    expect("inputs" in header).toBe(false);
  });
});

function _readJson(filename: string) {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, filename), "utf-8")
  );
}

describe("serializeMultipleQueryInputFeather", () => {
  const body1: IntermediateRequestBodyJSON<
    { foo: number; bar: string; baz: string },
    "bar" | "foo" | "baz"
  > = {
    inputs: { foo: [2, 4, 6, 8, 10, 12] },
    outputs: ["bar"],
    query_name: "Paddington",
    correlation_id: "9999999999",
    staleness: {
      bar: "1h",
    },
  };

  const body2: IntermediateRequestBodyJSON<
    { foo: number; bar: string; baz: string },
    "bar" | "foo" | "baz"
  > = {
    inputs: { foo: [123, 234, 345, 456] },
    outputs: ["baz", "bar"],
    query_name: "Josephine",
    correlation_id: "fun_correlation_id",
    staleness: {
      bar: "1h",
      baz: "1d",
    },
  };

  it("should serialize a single input body correctly", () => {
    const serialized = serializeMultipleQueryInputFeather([body1]);
    const parsed = _testDeserializeMultiQueryFeatherRequest(serialized);
    const json = _readJson("json/request_single.json");
    expect(parsed).toMatchObject(json);
  });

  it("should serialize multiple input bodies correctly", () => {
    const serialized = serializeMultipleQueryInputFeather([body1, body2]);
    const parsed = _testDeserializeMultiQueryFeatherRequest(serialized);
    const json = _readJson("json/request_multi.json");
    expect(parsed).toMatchObject(json);
  });
});

/**
 * Don't use this for production; it's just a quick way to test that
 * we're serializing the request in a reasonable way
 */
function _testDeserializeMultiQueryFeatherRequest(buffer: Buffer) {
  const decoder = new TextDecoder();

  let offset = 0;
  const requestMagicBytes = buffer.subarray(
    offset,
    offset + MULTI_QUERY_MAGIC_STR.length
  );
  offset += MULTI_QUERY_MAGIC_STR.length;
  if (decoder.decode(requestMagicBytes) !== MULTI_QUERY_MAGIC_STR) {
    throw new Error(
      "Bulk query request was not prefixed with appropriate string constant"
    );
  }
  const outputs: Array<{ header: any; body: any }> = [];

  while (offset < buffer.length) {
    const headerSizeLen = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
    const headerStr = decoder.decode(
      buffer.subarray(offset, offset + headerSizeLen)
    );
    offset += headerSizeLen;
    const jsonHeader = JSON.parse(headerStr);

    const bodySizeLen = Number(buffer.readBigUInt64BE(offset));
    offset += 8;

    const body = buffer.subarray(offset, offset + bodySizeLen);
    const bodyTable = tableFromIPC(body);
    offset += bodySizeLen;

    outputs.push({ header: jsonHeader, body: bodyTable });
  }

  return outputs;
}
