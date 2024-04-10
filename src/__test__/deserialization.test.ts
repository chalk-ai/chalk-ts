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
    const byte_data = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_multi.bytes")
    );
    const parsedData = JSON.parse(
      JSON.stringify(parseFeatherQueryResponse(byte_data))
    );
    const expectedJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "json/uncompressed_multi.json"),
        "utf-8"
      )
    );
    expect(parsedData).toMatchObject(expectedJson);
  });

  it("should handle a single-query feather response", () => {
    const byte_data = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_single.bytes")
    );
    const parsedData = JSON.parse(
      JSON.stringify(parseFeatherQueryResponse(byte_data))
    );
    const expectedJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "json/uncompressed_single.json"),
        "utf-8"
      )
    );
    expect(parsedData).toMatchObject(expectedJson);
  });

  it("should handle a multi-query feather response with errors in one response", () => {
    const byte_data = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_multi_error.bytes")
    );
    const parsedData = JSON.parse(
      JSON.stringify(parseFeatherQueryResponse(byte_data))
    );
    const expectedJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "json/uncompressed_multi_error.json"),
        "utf-8"
      )
    );
    expect(parsedData).toMatchObject(expectedJson);
  });

  it("should be able to handle a multi-query with three query inputs", () => {
    const byte_data = fs.readFileSync(
      path.resolve(__dirname, "binaries/uncompressed_triple.bytes")
    );
    const parsedData = JSON.parse(
      JSON.stringify(parseFeatherQueryResponse(byte_data))
    );
    const expectedJson = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, "json/uncompressed_triple.json"),
        "utf-8"
      )
    );
    expect(parsedData).toMatchObject(expectedJson);
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
