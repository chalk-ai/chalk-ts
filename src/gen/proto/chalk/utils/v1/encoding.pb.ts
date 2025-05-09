// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               unknown
// source: chalk/utils/v1/encoding.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";

export const protobufPackage = "chalk.utils.v1";

export interface StringEncoding {
  mapping: { [key: number]: string };
}

export interface StringEncoding_MappingEntry {
  key: number;
  value: string;
}

function createBaseStringEncoding(): StringEncoding {
  return { mapping: {} };
}

export const StringEncoding: MessageFns<StringEncoding> = {
  encode(message: StringEncoding, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    Object.entries(message.mapping).forEach(([key, value]) => {
      StringEncoding_MappingEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).join();
    });
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): StringEncoding {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStringEncoding();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          const entry1 = StringEncoding_MappingEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.mapping[entry1.key] = entry1.value;
          }
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StringEncoding {
    return {
      mapping: isObject(object.mapping)
        ? Object.entries(object.mapping).reduce<{ [key: number]: string }>((acc, [key, value]) => {
          acc[globalThis.Number(key)] = String(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: StringEncoding): unknown {
    const obj: any = {};
    if (message.mapping) {
      const entries = Object.entries(message.mapping);
      if (entries.length > 0) {
        obj.mapping = {};
        entries.forEach(([k, v]) => {
          obj.mapping[k] = v;
        });
      }
    }
    return obj;
  },
};

function createBaseStringEncoding_MappingEntry(): StringEncoding_MappingEntry {
  return { key: 0, value: "" };
}

export const StringEncoding_MappingEntry: MessageFns<StringEncoding_MappingEntry> = {
  encode(message: StringEncoding_MappingEntry, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.key !== 0) {
      writer.uint32(8).int32(message.key);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): StringEncoding_MappingEntry {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStringEncoding_MappingEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 8) {
            break;
          }

          message.key = reader.int32();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.value = reader.string();
          continue;
        }
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): StringEncoding_MappingEntry {
    return {
      key: isSet(object.key) ? globalThis.Number(object.key) : 0,
      value: isSet(object.value) ? globalThis.String(object.value) : "",
    };
  },

  toJSON(message: StringEncoding_MappingEntry): unknown {
    const obj: any = {};
    if (message.key !== 0) {
      obj.key = Math.round(message.key);
    }
    if (message.value !== "") {
      obj.value = message.value;
    }
    return obj;
  },
};

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
}
