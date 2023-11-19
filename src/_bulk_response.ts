interface ByteModel {
  attrs: { [key: string]: number };
  pydantic: { [key: string]: number };
  attrAndByteOffset: { [key: string]: number };
  concatenatedByteObjects: Buffer;
  attrAndByteOffsetForSerializables: { [key: string]: number };
  concatenatedSerializableByteObjects: Buffer;
}

export function parseByteModel(raw: Buffer): ByteModel {
  const decoder = new TextDecoder();

  const responseMagicStr = "CHALK_BYTE_TRANSMISSION";

  let offset = 0;

  const responseMagicBytes = raw.subarray(
    offset,
    offset + responseMagicStr.length
  );
  offset += responseMagicStr.length;
  if (decoder.decode(responseMagicBytes) !== responseMagicStr) {
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
