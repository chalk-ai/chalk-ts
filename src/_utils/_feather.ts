import { tableFromArrays, tableToIPC } from "apache-arrow";
import { MULTI_QUERY_MAGIC_STR } from "../_bulk_response";
import { ChalkOnlineBulkQueryRequest } from "../_interface";
import { tableFromArraysTyped } from "./_arrow";

export interface IntermediateRequestBodyJSON<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> {
  inputs: Partial<{ [K in keyof TFeatureMap]: TFeatureMap[K][] }>;
  outputs: TOutput[];
  context?: {
    tags?: string[];
  };
  explain?: boolean;
  include_meta?: boolean;
  query_context?: {
    [key: string]: string | number | boolean;
  };
  correlation_id?: string;
  deployment_id?: string;
  meta?: {
    [key: string]: string;
  };
  planner_options?: Record<string, unknown>;
  query_name?: string;
  query_name_version?: string;
  staleness?: {
    [K in keyof TFeatureMap]?: string;
  };
  now?: string;
}

type IntermediateRequestBodyJSONWithoutInputs<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> = Omit<IntermediateRequestBodyJSON<TFeatureMap, TOutput>, "inputs">;

interface OnlineQueryFeatherRequestHeader<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
> extends IntermediateRequestBodyJSONWithoutInputs<TFeatureMap, TOutput> {
  // these are the only currently supported values
  feather_body_type: "RECORD_BATCHES";
  response_compression_scheme: "uncompressed";
  client_supports_64bit: false;
  client_supported_64bit_types: string[];
}

export function featherRequestHeaderFromBody<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  body: IntermediateRequestBodyJSON<TFeatureMap, TOutput>
): OnlineQueryFeatherRequestHeader<TFeatureMap, TOutput> {
  const { inputs, ...rest } = body;
  return {
    ...rest,
    feather_body_type: "RECORD_BATCHES",
    response_compression_scheme: "uncompressed",
    client_supports_64bit: false,
    client_supported_64bit_types: ["Int64", "LargeBinary"],
  };
}

export function serializeBulkQueryInputFeather<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(
  inputs: ChalkOnlineBulkQueryRequest<TFeatureMap, TOutput>["inputs"]
): Uint8Array {
  return tableToIPC(tableFromArraysTyped(inputs), "file");
}

export function serializeMultipleQueryInputFeather<
  TFeatureMap,
  TOutput extends keyof TFeatureMap
>(requests: IntermediateRequestBodyJSON<TFeatureMap, TOutput>[]): Buffer {
  const utf8Encode: TextEncoder = new TextEncoder();

  const encodedRequests = requests.map((request) => {
    const bodyBytes = tableToIPC(
      tableFromArrays(
        request.inputs as Record<TOutput, Array<TFeatureMap[TOutput]>>
      )
    );
    const header = featherRequestHeaderFromBody(request);
    const headerBytes = utf8Encode.encode(JSON.stringify(header));

    return {
      body: bodyBytes,
      header: headerBytes,
    };
  });

  const totalLength = encodedRequests.reduce(
    (acc, { body, header }) => acc + body.length + header.length,
    0
  );

  const magicBytes: Uint8Array = utf8Encode.encode(MULTI_QUERY_MAGIC_STR);

  const fullArrayBufferSize =
    magicBytes.length + // length of magic byte prefix
    totalLength + // length of body plus header bytes
    2 * encodedRequests.length * 8; // 64-bit ints with the length of each body and header

  const arrayBuffer = Buffer.alloc(fullArrayBufferSize);

  let offset = 0;
  arrayBuffer.write(MULTI_QUERY_MAGIC_STR, offset);
  offset += magicBytes.length;

  encodedRequests.forEach(({ header, body }) => {
    arrayBuffer.writeBigInt64BE(BigInt(header.length), offset);
    offset += 8;
    arrayBuffer.set(header, offset);
    offset += header.length;
    arrayBuffer.writeBigInt64BE(BigInt(body.length), offset);
    offset += 8;
    arrayBuffer.set(body, offset);
    offset += body.length;
  });

  return arrayBuffer;
}
