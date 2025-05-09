import {
  tableFromIPC,
  DataType,
  Table,
  vectorFromArray,
  Timestamp,
  TimeUnit,
  Utf8,
} from "apache-arrow";
import { RawQueryResponseMeta } from "./_services/_http";
import { ChalkErrorData, ChalkQueryMeta, TimestampFormat } from "./_interface";
import { mapRawResponseMeta } from "./_meta";
import { ChalkClientConfig } from "./_interface";

interface ByteModel {
  attrs: { [key: string]: number | string } & {
    errors?: string[];
    meta?: string;
  };
  pydantic: { [key: string]: number };
  attrAndByteOffset: { [key: string]: number };
  concatenatedByteObjects: Buffer;
  attrAndByteOffsetForSerializables: { [key: string]: number };
  concatenatedSerializableByteObjects: Buffer;
}

export const MULTI_QUERY_MAGIC_STR = "chal1";
export const MULTI_QUERY_RESPONSE_MAGIC_STR = "CHALK_BYTE_TRANSMISSION";

const assertBufferBeginsWithMagicString = (
  buf: Buffer,
  decoder: TextDecoder,
  offset = 0
): number => {
  const responseMagicBytes = buf.subarray(
    offset,
    offset + MULTI_QUERY_RESPONSE_MAGIC_STR.length
  );
  if (decoder.decode(responseMagicBytes) !== MULTI_QUERY_RESPONSE_MAGIC_STR) {
    throw new Error(
      "Bulk query response was not prefixed with appropriate string constant"
    );
  }

  return offset + +MULTI_QUERY_RESPONSE_MAGIC_STR.length;
};

const readBufferFromOffset = (
  buf: Buffer,
  offset: number
): [subBuffer: Buffer, newOffset: number] => {
  const bufLength = Number(buf.readBigUInt64BE(offset));
  const offsetFromContent = offset + 8;
  const subBuffer = buf.subarray(
    offsetFromContent,
    offsetFromContent + bufLength
  );

  return [subBuffer, offsetFromContent + bufLength];
};

export function parseByteModel(raw: Buffer): ByteModel {
  const decoder = new TextDecoder();

  const offsetFromMagicString = assertBufferBeginsWithMagicString(raw, decoder);

  const [attrsBytes, offsetFromAttrs] = readBufferFromOffset(
    raw,
    offsetFromMagicString
  );
  const [pydanticBytes, offsetFromPydantic] = readBufferFromOffset(
    raw,
    offsetFromAttrs
  );

  const [jsonBytes, offsetFromJSON] = readBufferFromOffset(
    raw,
    offsetFromPydantic
  );

  const jsonParsed = JSON.parse(decoder.decode(jsonBytes));

  let bodyLen = 0;

  for (const k in jsonParsed) {
    bodyLen += jsonParsed[k];
  }

  const concatenatedByteObjects = raw.subarray(
    offsetFromJSON,
    bodyLen + offsetFromJSON
  );
  const offsetFromBytes = offsetFromJSON + bodyLen;

  const [jsonBytes2, offsetFromJSONBytes2] = readBufferFromOffset(
    raw,
    offsetFromBytes
  );
  const jsonParsed2 = JSON.parse(decoder.decode(jsonBytes2));

  let bodyLen2 = 0;

  for (const k in jsonParsed2) {
    bodyLen2 += jsonParsed2[k];
  }

  const concatenatedByteObjects2 = raw.subarray(
    offsetFromJSONBytes2,
    bodyLen2 + offsetFromJSONBytes2
  );

  return {
    attrs: JSON.parse(decoder.decode(attrsBytes)),
    pydantic: JSON.parse(decoder.decode(pydanticBytes)),
    attrAndByteOffset: jsonParsed,
    concatenatedByteObjects: concatenatedByteObjects,
    attrAndByteOffsetForSerializables: jsonParsed2,
    concatenatedSerializableByteObjects: concatenatedByteObjects2,
  };
}

export function sortJsonDictByKeys(json: {
  [key: string]: number;
}): Array<{ key: string; value: number }> {
  return Object.keys(json)
    .sort()
    .map((k) => ({ key: k, value: json[k] }));
}

export interface QueryChunkResult {
  data: any[];
  meta?: ChalkQueryMeta;
  errors?: ChalkErrorData[];
}

interface QueryChunkResultsWithOffset {
  offset: number;
  chunkResults: QueryChunkResult[];
}

export function processArrowTable(
  table: Table,
  { timestampFormat }: Pick<ChalkClientConfig, "timestampFormat">
): Table {
  let newTable = table;
  for (let index = 0; index < table.numCols; index++) {
    const vector = table.getChildAt(index);
    if (!vector) {
      continue;
    }

    if (
      timestampFormat === TimestampFormat.ISO_8601 &&
      DataType.isTimestamp(vector.type)
    ) {
      const newVector = vectorFromArray<Utf8>(
        Array.from(vector, (data) => new Date(data).toISOString()),
        new Utf8()
      );
      newTable = newTable.setChildAt(index, newVector);
    } else if (
      timestampFormat == TimestampFormat.EPOCH_MILLIS &&
      DataType.isDate(vector.type)
    ) {
      const newVector = vectorFromArray<Timestamp>(
        Array.from(vector, (data) => new Date(data)),
        new Timestamp(TimeUnit.MILLISECOND)
      );

      newTable = newTable.setChildAt(index, newVector);
    }
  }

  return newTable;
}

export function parseFeatherQueryResponse(
  result: Buffer,
  config: Pick<ChalkClientConfig, "timestampFormat">
): QueryChunkResult[] {
  const outer = parseByteModel(result);

  const inner = parseByteModel(
    outer.concatenatedSerializableByteObjects.subarray(
      0,
      outer.attrAndByteOffsetForSerializables["query_results_bytes"]
    )
  );

  const multiResponseAttrsSorted = sortJsonDictByKeys(inner.attrAndByteOffset);

  const accumulated =
    multiResponseAttrsSorted.reduce<QueryChunkResultsWithOffset>(
      (acc, val) => {
        const chunk = parseByteModel(
          inner.concatenatedByteObjects.subarray(
            acc.offset,
            acc.offset + val.value
          )
        );
        const ipcTable = processArrowTable(
          tableFromIPC(chunk.concatenatedByteObjects),
          config
        );
        acc.chunkResults.push({
          data: ipcTable.toArray() as any,
          meta:
            chunk.attrs.meta != null
              ? mapRawResponseMeta(
                  JSON.parse(chunk.attrs.meta as string) as RawQueryResponseMeta
                )
              : undefined,
          errors:
            chunk.attrs.errors != null && chunk.attrs.errors.length > 0
              ? chunk.attrs.errors.map((e) => JSON.parse(e))
              : undefined,
        });

        return {
          offset: acc.offset + val.value,
          chunkResults: acc.chunkResults,
        };
      },
      {
        offset: 0,
        chunkResults: [],
      }
    );

  return accumulated.chunkResults;
}
