import { tableFromIPC } from "apache-arrow";
import { ChalkError, ChalkQueryMeta } from "./_interface";

interface ByteModel {
  attrs: { [key: string]: number | string };
  pydantic: { [key: string]: number };
  attrAndByteOffset: { [key: string]: number };
  concatenatedByteObjects: Buffer;
  attrAndByteOffsetForSerializables: { [key: string]: number };
  concatenatedSerializableByteObjects: Buffer;
}

export const MULTI_QUERY_MAGIC_STR = "chal1";
export const MULTI_QUERY_RESPONSE_MAGIC_STR = "CHALK_BYTE_TRANSMISSION";

export function parseByteModel(raw: Buffer): ByteModel {
  const decoder = new TextDecoder();

  let offset = 0;

  const responseMagicBytes = raw.subarray(
    offset,
    offset + MULTI_QUERY_RESPONSE_MAGIC_STR.length
  );
  offset += MULTI_QUERY_RESPONSE_MAGIC_STR.length;
  if (decoder.decode(responseMagicBytes) !== MULTI_QUERY_RESPONSE_MAGIC_STR) {
    throw new Error(
      "Bulk query response was not prefixed with appropriate string constant"
    );
  }

  let curLen = Number(raw.readBigUInt64BE(offset));
  offset += 8;
  const attrsBytes = raw.subarray(offset, curLen + offset);
  offset += curLen;

  curLen = Number(raw.readBigUint64BE(offset));
  offset += 8;
  const pydanticBytes = raw.subarray(offset, curLen + offset);
  offset += curLen;

  curLen = Number(raw.readBigUint64BE(offset));
  offset += 8;
  const jsonStr = decoder.decode(raw.subarray(offset, curLen + offset));
  const jsonParsed = JSON.parse(jsonStr);
  offset += curLen;

  let bodyLen = 0;

  for (let k in jsonParsed) {
    bodyLen += jsonParsed[k];
  }

  const concatenatedByteObjects = raw.subarray(offset, bodyLen + offset);
  offset += bodyLen;

  curLen = Number(raw.readBigUint64BE(offset));
  offset += 8;
  const jsonStr2 = decoder.decode(raw.subarray(offset, curLen + offset));
  const jsonParsed2 = JSON.parse(jsonStr2);
  offset += curLen;

  let bodyLen2 = 0;

  for (let k in jsonParsed2) {
    bodyLen2 += jsonParsed2[k];
  }

  const concatenatedByteObjects2 = raw.subarray(offset, bodyLen2 + offset);
  offset += bodyLen2;

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
  errors?: ChalkError[];
}

interface QueryChunkResultsWithOffset {
  offset: number;
  chunkResults: QueryChunkResult[];
}

export function parseFeatherQueryResponse(result: Buffer): QueryChunkResult[] {
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
        const ipcTable = tableFromIPC(chunk.concatenatedByteObjects);
        acc.chunkResults.push({
          data: ipcTable.toArray() as any,
          meta:
            chunk.attrs.meta != null
              ? JSON.parse(chunk.attrs.meta as string)
              : undefined,
          errors:
            chunk.attrs.errors != null
              ? (chunk.attrs.errors as any as string[]).map((e) =>
                  JSON.parse(e)
                )
              : [],
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
