// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               unknown
// source: chalk/server/v1/scheduled_query_run.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { FieldMask } from "../../../google/protobuf/field_mask.pb";
import { Timestamp } from "../../../google/protobuf/timestamp.pb";
import { OfflineQueryMeta } from "./offline_queries.pb";

export const protobufPackage = "chalk.server.v1";

export interface ScheduledQueryRun {
  id: number;
  environmentId: string;
  deploymentId?: string | undefined;
  runId?: string | undefined;
  cronQueryId: number;
  cronQueryScheduleId: number;
  cronName: string;
  gcrExecutionId?: string | undefined;
  gcrJobName?: string | undefined;
  offlineQueryId: string;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

export interface GetScheduledQueryRunRequest {
  runId?: number | undefined;
  offlineQueryId?: string | undefined;
  getMask: string[] | undefined;
}

export interface GetScheduledQueryRunResponse {
  scheduledQueryRun: ScheduledQueryRun | undefined;
  offlineQuery?: OfflineQueryMeta | undefined;
}

function createBaseScheduledQueryRun(): ScheduledQueryRun {
  return {
    id: 0,
    environmentId: "",
    deploymentId: undefined,
    runId: undefined,
    cronQueryId: 0,
    cronQueryScheduleId: 0,
    cronName: "",
    gcrExecutionId: undefined,
    gcrJobName: undefined,
    offlineQueryId: "",
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export const ScheduledQueryRun: MessageFns<ScheduledQueryRun> = {
  encode(message: ScheduledQueryRun, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.id !== 0) {
      writer.uint32(8).int64(message.id);
    }
    if (message.environmentId !== "") {
      writer.uint32(18).string(message.environmentId);
    }
    if (message.deploymentId !== undefined) {
      writer.uint32(26).string(message.deploymentId);
    }
    if (message.runId !== undefined) {
      writer.uint32(34).string(message.runId);
    }
    if (message.cronQueryId !== 0) {
      writer.uint32(40).int64(message.cronQueryId);
    }
    if (message.cronQueryScheduleId !== 0) {
      writer.uint32(48).int64(message.cronQueryScheduleId);
    }
    if (message.cronName !== "") {
      writer.uint32(58).string(message.cronName);
    }
    if (message.gcrExecutionId !== undefined) {
      writer.uint32(66).string(message.gcrExecutionId);
    }
    if (message.gcrJobName !== undefined) {
      writer.uint32(74).string(message.gcrJobName);
    }
    if (message.offlineQueryId !== "") {
      writer.uint32(82).string(message.offlineQueryId);
    }
    if (message.createdAt !== undefined) {
      Timestamp.encode(toTimestamp(message.createdAt), writer.uint32(90).fork()).join();
    }
    if (message.updatedAt !== undefined) {
      Timestamp.encode(toTimestamp(message.updatedAt), writer.uint32(98).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ScheduledQueryRun {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseScheduledQueryRun();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 8) {
            break;
          }

          message.id = longToNumber(reader.int64());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.environmentId = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.deploymentId = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }

          message.runId = reader.string();
          continue;
        }
        case 5: {
          if (tag !== 40) {
            break;
          }

          message.cronQueryId = longToNumber(reader.int64());
          continue;
        }
        case 6: {
          if (tag !== 48) {
            break;
          }

          message.cronQueryScheduleId = longToNumber(reader.int64());
          continue;
        }
        case 7: {
          if (tag !== 58) {
            break;
          }

          message.cronName = reader.string();
          continue;
        }
        case 8: {
          if (tag !== 66) {
            break;
          }

          message.gcrExecutionId = reader.string();
          continue;
        }
        case 9: {
          if (tag !== 74) {
            break;
          }

          message.gcrJobName = reader.string();
          continue;
        }
        case 10: {
          if (tag !== 82) {
            break;
          }

          message.offlineQueryId = reader.string();
          continue;
        }
        case 11: {
          if (tag !== 90) {
            break;
          }

          message.createdAt = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
          continue;
        }
        case 12: {
          if (tag !== 98) {
            break;
          }

          message.updatedAt = fromTimestamp(Timestamp.decode(reader, reader.uint32()));
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

  fromJSON(object: any): ScheduledQueryRun {
    return {
      id: isSet(object.id) ? globalThis.Number(object.id) : 0,
      environmentId: isSet(object.environmentId) ? globalThis.String(object.environmentId) : "",
      deploymentId: isSet(object.deploymentId) ? globalThis.String(object.deploymentId) : undefined,
      runId: isSet(object.runId) ? globalThis.String(object.runId) : undefined,
      cronQueryId: isSet(object.cronQueryId) ? globalThis.Number(object.cronQueryId) : 0,
      cronQueryScheduleId: isSet(object.cronQueryScheduleId) ? globalThis.Number(object.cronQueryScheduleId) : 0,
      cronName: isSet(object.cronName) ? globalThis.String(object.cronName) : "",
      gcrExecutionId: isSet(object.gcrExecutionId) ? globalThis.String(object.gcrExecutionId) : undefined,
      gcrJobName: isSet(object.gcrJobName) ? globalThis.String(object.gcrJobName) : undefined,
      offlineQueryId: isSet(object.offlineQueryId) ? globalThis.String(object.offlineQueryId) : "",
      createdAt: isSet(object.createdAt) ? fromJsonTimestamp(object.createdAt) : undefined,
      updatedAt: isSet(object.updatedAt) ? fromJsonTimestamp(object.updatedAt) : undefined,
    };
  },

  toJSON(message: ScheduledQueryRun): unknown {
    const obj: any = {};
    if (message.id !== 0) {
      obj.id = Math.round(message.id);
    }
    if (message.environmentId !== "") {
      obj.environmentId = message.environmentId;
    }
    if (message.deploymentId !== undefined) {
      obj.deploymentId = message.deploymentId;
    }
    if (message.runId !== undefined) {
      obj.runId = message.runId;
    }
    if (message.cronQueryId !== 0) {
      obj.cronQueryId = Math.round(message.cronQueryId);
    }
    if (message.cronQueryScheduleId !== 0) {
      obj.cronQueryScheduleId = Math.round(message.cronQueryScheduleId);
    }
    if (message.cronName !== "") {
      obj.cronName = message.cronName;
    }
    if (message.gcrExecutionId !== undefined) {
      obj.gcrExecutionId = message.gcrExecutionId;
    }
    if (message.gcrJobName !== undefined) {
      obj.gcrJobName = message.gcrJobName;
    }
    if (message.offlineQueryId !== "") {
      obj.offlineQueryId = message.offlineQueryId;
    }
    if (message.createdAt !== undefined) {
      obj.createdAt = message.createdAt.toISOString();
    }
    if (message.updatedAt !== undefined) {
      obj.updatedAt = message.updatedAt.toISOString();
    }
    return obj;
  },
};

function createBaseGetScheduledQueryRunRequest(): GetScheduledQueryRunRequest {
  return { runId: undefined, offlineQueryId: undefined, getMask: undefined };
}

export const GetScheduledQueryRunRequest: MessageFns<GetScheduledQueryRunRequest> = {
  encode(message: GetScheduledQueryRunRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.runId !== undefined) {
      writer.uint32(8).int64(message.runId);
    }
    if (message.offlineQueryId !== undefined) {
      writer.uint32(18).string(message.offlineQueryId);
    }
    if (message.getMask !== undefined) {
      FieldMask.encode(FieldMask.wrap(message.getMask), writer.uint32(26).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetScheduledQueryRunRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetScheduledQueryRunRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 8) {
            break;
          }

          message.runId = longToNumber(reader.int64());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.offlineQueryId = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.getMask = FieldMask.unwrap(FieldMask.decode(reader, reader.uint32()));
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

  fromJSON(object: any): GetScheduledQueryRunRequest {
    return {
      runId: isSet(object.runId) ? globalThis.Number(object.runId) : undefined,
      offlineQueryId: isSet(object.offlineQueryId) ? globalThis.String(object.offlineQueryId) : undefined,
      getMask: isSet(object.getMask) ? FieldMask.unwrap(FieldMask.fromJSON(object.getMask)) : undefined,
    };
  },

  toJSON(message: GetScheduledQueryRunRequest): unknown {
    const obj: any = {};
    if (message.runId !== undefined) {
      obj.runId = Math.round(message.runId);
    }
    if (message.offlineQueryId !== undefined) {
      obj.offlineQueryId = message.offlineQueryId;
    }
    if (message.getMask !== undefined) {
      obj.getMask = FieldMask.toJSON(FieldMask.wrap(message.getMask));
    }
    return obj;
  },
};

function createBaseGetScheduledQueryRunResponse(): GetScheduledQueryRunResponse {
  return { scheduledQueryRun: undefined, offlineQuery: undefined };
}

export const GetScheduledQueryRunResponse: MessageFns<GetScheduledQueryRunResponse> = {
  encode(message: GetScheduledQueryRunResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.scheduledQueryRun !== undefined) {
      ScheduledQueryRun.encode(message.scheduledQueryRun, writer.uint32(10).fork()).join();
    }
    if (message.offlineQuery !== undefined) {
      OfflineQueryMeta.encode(message.offlineQuery, writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetScheduledQueryRunResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetScheduledQueryRunResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.scheduledQueryRun = ScheduledQueryRun.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.offlineQuery = OfflineQueryMeta.decode(reader, reader.uint32());
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

  fromJSON(object: any): GetScheduledQueryRunResponse {
    return {
      scheduledQueryRun: isSet(object.scheduledQueryRun)
        ? ScheduledQueryRun.fromJSON(object.scheduledQueryRun)
        : undefined,
      offlineQuery: isSet(object.offlineQuery) ? OfflineQueryMeta.fromJSON(object.offlineQuery) : undefined,
    };
  },

  toJSON(message: GetScheduledQueryRunResponse): unknown {
    const obj: any = {};
    if (message.scheduledQueryRun !== undefined) {
      obj.scheduledQueryRun = ScheduledQueryRun.toJSON(message.scheduledQueryRun);
    }
    if (message.offlineQuery !== undefined) {
      obj.offlineQuery = OfflineQueryMeta.toJSON(message.offlineQuery);
    }
    return obj;
  },
};

function toTimestamp(date: Date): Timestamp {
  const seconds = Math.trunc(date.getTime() / 1_000);
  const nanos = (date.getTime() % 1_000) * 1_000_000;
  return { seconds, nanos };
}

function fromTimestamp(t: Timestamp): Date {
  let millis = (t.seconds || 0) * 1_000;
  millis += (t.nanos || 0) / 1_000_000;
  return new globalThis.Date(millis);
}

function fromJsonTimestamp(o: any): Date {
  if (o instanceof globalThis.Date) {
    return o;
  } else if (typeof o === "string") {
    return new globalThis.Date(o);
  } else {
    return fromTimestamp(Timestamp.fromJSON(o));
  }
}

function longToNumber(int64: { toString(): string }): number {
  const num = globalThis.Number(int64.toString());
  if (num > globalThis.Number.MAX_SAFE_INTEGER) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  if (num < globalThis.Number.MIN_SAFE_INTEGER) {
    throw new globalThis.Error("Value is smaller than Number.MIN_SAFE_INTEGER");
  }
  return num;
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
