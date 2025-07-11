import * as fs from "fs";
import * as path from "path";
import { parseByteModel, parseFeatherQueryResponse } from "../_bulk_response";
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
        useBigInt: false,
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

  it("should fail on compressed response; compression not implemented in arrow", () => {
    const single_bytes_compressed = fs.readFileSync(
      path.resolve(__dirname, "binaries/first.bytes")
    );

    const tryToParseCompressed = () =>
      parseFeatherQueryResponse(single_bytes_compressed, {
        timestampFormat: TimestampFormat.ISO_8601,
        useBigInt: false,
      });

    expect(tryToParseCompressed).toThrow(
      "Record batch compression not implemented"
    );
  });
});
