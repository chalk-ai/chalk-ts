import * as fs from "fs";
import * as path from "path";
import { tableToIPC, Vector } from "apache-arrow";
import { parseByteModel, parseFeatherQueryResponse } from "../_bulk_response";
import { tableFromArraysTyped } from "../_utils/_arrow";
import { TimestampFormat } from "../_interface";

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

function _parseByteDataToJSON(
  filename: string,
  timestampFormat: TimestampFormat = TimestampFormat.ISO_8601
) {
  const byte_data = fs.readFileSync(path.resolve(__dirname, filename));
  return JSON.parse(
    JSON.stringify(
      parseFeatherQueryResponse(byte_data, {
        timestampFormat,
      })
    )
  );
}

function _readJson(filename: string) {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, filename), "utf-8")
  );
}

describe("parseFeatherQueryResponse", () => {
  it("should handle a multi-query feather response", () => {
    const bytes = _parseByteDataToJSON("binaries/uncompressed_multi.bytes");
    const json = _readJson("json/uncompressed_multi.json");
    expect(bytes).toMatchObject(json);
  });

  it("should handle a feather response with epoch_millis timestamp option passed in", () => {
    const bytes = _parseByteDataToJSON(
      "binaries/uncompressed_multi.bytes",
      TimestampFormat.EPOCH_MILLIS
    );
    const json = _readJson("json/uncompressed_multi_epoch_millis.json");
    expect(bytes).toMatchObject(json);
  });

  it("should handle a single-query feather response", () => {
    const bytes = _parseByteDataToJSON("binaries/uncompressed_single.bytes");
    const json = _readJson("json/uncompressed_single.json");
    expect(bytes).toMatchObject(json);
  });

  it("should handle a multi-query feather response with errors in one response", () => {
    const bytes = _parseByteDataToJSON(
      "binaries/uncompressed_multi_error.bytes"
    );
    const json = _readJson("json/uncompressed_multi_error.json");
    expect(bytes).toMatchObject(json);
  });

  it("should be able to handle a multi-query with three query inputs", () => {
    const bytes = _parseByteDataToJSON("binaries/uncompressed_triple.bytes");
    const json = _readJson("json/uncompressed_triple.json");
    expect(bytes).toMatchObject(json);
  });

  // The fixture-based tests above compare via JSON.stringify, which cannot
  // detect leaked arrow types: Vector and StructRow serialize as plain
  // arrays/objects through toJSON(). These assertions run against the live
  // parsed objects instead, and the fixtures contain no list- or
  // struct-typed features, so the response is synthesized here.
  describe("arrow-specific types must not leak into parsed data", () => {
    const _lengthPrefixed = (buf: Buffer): Buffer => {
      const len = Buffer.alloc(8);
      len.writeBigUInt64BE(BigInt(buf.length));
      return Buffer.concat([len, buf]);
    };

    // Inverse of parseByteModel
    const _serializeByteModel = (
      body: { [key: string]: Buffer },
      serializableBody: { [key: string]: Buffer }
    ): Buffer => {
      const _offsets = (b: { [key: string]: Buffer }) =>
        Buffer.from(
          JSON.stringify(
            Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.length]))
          )
        );
      return Buffer.concat([
        Buffer.from("CHALK_BYTE_TRANSMISSION"),
        _lengthPrefixed(Buffer.from("{}")), // attrs
        _lengthPrefixed(Buffer.from("{}")), // pydantic
        _lengthPrefixed(_offsets(body)),
        ...Object.values(body),
        _lengthPrefixed(_offsets(serializableBody)),
        ...Object.values(serializableBody),
      ]);
    };

    const inputRows = {
      "user.id": [1, 2],
      "user.scores": [
        [1.5, 2.5],
        [3.5, 4.5],
      ],
      "user.profile": [
        { city: "sf", age: 30 },
        { city: "nyc", age: 40 },
      ],
    };
    const ipc = Buffer.from(tableToIPC(tableFromArraysTyped(inputRows), "file"));
    const chunk = _serializeByteModel({ table_bytes: ipc }, {});
    const inner = _serializeByteModel({ "0": chunk }, {});
    const responseBytes = _serializeByteModel({}, { query_results_bytes: inner });

    it("returns plain arrays and objects, not Vectors or StructRows", () => {
      const result = parseFeatherQueryResponse(responseBytes, {
        timestampFormat: TimestampFormat.ISO_8601,
      });
      const row = result[0].data[0];

      expect(row["user.scores"]).not.toBeInstanceOf(Vector);
      expect(Array.isArray(row["user.scores"])).toBe(true);
      expect(row.constructor).toBe(Object); // plain object, not StructRow
      expect(result[0].data).toEqual([
        {
          "user.id": 1,
          "user.scores": [1.5, 2.5],
          "user.profile": { city: "sf", age: 30 },
        },
        {
          "user.id": 2,
          "user.scores": [3.5, 4.5],
          "user.profile": { city: "nyc", age: 40 },
        },
      ]);
    });
  });

  it("should fail on compressed response; compression not implemented in arrow", () => {
    const single_bytes_compressed = fs.readFileSync(
      path.resolve(__dirname, "binaries/first.bytes")
    );

    const tryToParseCompressed = () =>
      parseFeatherQueryResponse(single_bytes_compressed, {
        timestampFormat: TimestampFormat.ISO_8601,
      });

    expect(tryToParseCompressed).toThrow(
      "Record batch compression not implemented"
    );
  });
});
