// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               unknown
// source: chalk/kubernetes/v1/persistentvolume.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";

export const protobufPackage = "chalk.kubernetes.v1";

export interface ChalkKubernetesPersistentVolume {
  spec: ChalkKubernetesPersistentVolumeSpec | undefined;
  metrics: ChalkKubernetesPersistentVolumeMetrics | undefined;
}

export interface ChalkKubernetesPersistentVolumeSpec {
  storageClass: string;
  name: string;
  accessModes: string[];
  capacity: string;
  status: string;
  reclaimPolicy: string;
  claim: string;
}

export interface ChalkKubernetesPersistentVolumeMetrics {
  /** Double to match prometheus type */
  capacityBytes: number;
  usedBytes: number;
  availableBytes: number;
}

function createBaseChalkKubernetesPersistentVolume(): ChalkKubernetesPersistentVolume {
  return { spec: undefined, metrics: undefined };
}

export const ChalkKubernetesPersistentVolume: MessageFns<ChalkKubernetesPersistentVolume> = {
  encode(message: ChalkKubernetesPersistentVolume, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.spec !== undefined) {
      ChalkKubernetesPersistentVolumeSpec.encode(message.spec, writer.uint32(10).fork()).join();
    }
    if (message.metrics !== undefined) {
      ChalkKubernetesPersistentVolumeMetrics.encode(message.metrics, writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ChalkKubernetesPersistentVolume {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChalkKubernetesPersistentVolume();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.spec = ChalkKubernetesPersistentVolumeSpec.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.metrics = ChalkKubernetesPersistentVolumeMetrics.decode(reader, reader.uint32());
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

  fromJSON(object: any): ChalkKubernetesPersistentVolume {
    return {
      spec: isSet(object.spec) ? ChalkKubernetesPersistentVolumeSpec.fromJSON(object.spec) : undefined,
      metrics: isSet(object.metrics) ? ChalkKubernetesPersistentVolumeMetrics.fromJSON(object.metrics) : undefined,
    };
  },

  toJSON(message: ChalkKubernetesPersistentVolume): unknown {
    const obj: any = {};
    if (message.spec !== undefined) {
      obj.spec = ChalkKubernetesPersistentVolumeSpec.toJSON(message.spec);
    }
    if (message.metrics !== undefined) {
      obj.metrics = ChalkKubernetesPersistentVolumeMetrics.toJSON(message.metrics);
    }
    return obj;
  },
};

function createBaseChalkKubernetesPersistentVolumeSpec(): ChalkKubernetesPersistentVolumeSpec {
  return { storageClass: "", name: "", accessModes: [], capacity: "", status: "", reclaimPolicy: "", claim: "" };
}

export const ChalkKubernetesPersistentVolumeSpec: MessageFns<ChalkKubernetesPersistentVolumeSpec> = {
  encode(message: ChalkKubernetesPersistentVolumeSpec, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.storageClass !== "") {
      writer.uint32(10).string(message.storageClass);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    for (const v of message.accessModes) {
      writer.uint32(26).string(v!);
    }
    if (message.capacity !== "") {
      writer.uint32(34).string(message.capacity);
    }
    if (message.status !== "") {
      writer.uint32(42).string(message.status);
    }
    if (message.reclaimPolicy !== "") {
      writer.uint32(50).string(message.reclaimPolicy);
    }
    if (message.claim !== "") {
      writer.uint32(58).string(message.claim);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ChalkKubernetesPersistentVolumeSpec {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChalkKubernetesPersistentVolumeSpec();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.storageClass = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.name = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.accessModes.push(reader.string());
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }

          message.capacity = reader.string();
          continue;
        }
        case 5: {
          if (tag !== 42) {
            break;
          }

          message.status = reader.string();
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }

          message.reclaimPolicy = reader.string();
          continue;
        }
        case 7: {
          if (tag !== 58) {
            break;
          }

          message.claim = reader.string();
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

  fromJSON(object: any): ChalkKubernetesPersistentVolumeSpec {
    return {
      storageClass: isSet(object.storageClass) ? globalThis.String(object.storageClass) : "",
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      accessModes: globalThis.Array.isArray(object?.accessModes)
        ? object.accessModes.map((e: any) => globalThis.String(e))
        : [],
      capacity: isSet(object.capacity) ? globalThis.String(object.capacity) : "",
      status: isSet(object.status) ? globalThis.String(object.status) : "",
      reclaimPolicy: isSet(object.reclaimPolicy) ? globalThis.String(object.reclaimPolicy) : "",
      claim: isSet(object.claim) ? globalThis.String(object.claim) : "",
    };
  },

  toJSON(message: ChalkKubernetesPersistentVolumeSpec): unknown {
    const obj: any = {};
    if (message.storageClass !== "") {
      obj.storageClass = message.storageClass;
    }
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.accessModes?.length) {
      obj.accessModes = message.accessModes;
    }
    if (message.capacity !== "") {
      obj.capacity = message.capacity;
    }
    if (message.status !== "") {
      obj.status = message.status;
    }
    if (message.reclaimPolicy !== "") {
      obj.reclaimPolicy = message.reclaimPolicy;
    }
    if (message.claim !== "") {
      obj.claim = message.claim;
    }
    return obj;
  },
};

function createBaseChalkKubernetesPersistentVolumeMetrics(): ChalkKubernetesPersistentVolumeMetrics {
  return { capacityBytes: 0, usedBytes: 0, availableBytes: 0 };
}

export const ChalkKubernetesPersistentVolumeMetrics: MessageFns<ChalkKubernetesPersistentVolumeMetrics> = {
  encode(message: ChalkKubernetesPersistentVolumeMetrics, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.capacityBytes !== 0) {
      writer.uint32(9).double(message.capacityBytes);
    }
    if (message.usedBytes !== 0) {
      writer.uint32(17).double(message.usedBytes);
    }
    if (message.availableBytes !== 0) {
      writer.uint32(25).double(message.availableBytes);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ChalkKubernetesPersistentVolumeMetrics {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChalkKubernetesPersistentVolumeMetrics();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 9) {
            break;
          }

          message.capacityBytes = reader.double();
          continue;
        }
        case 2: {
          if (tag !== 17) {
            break;
          }

          message.usedBytes = reader.double();
          continue;
        }
        case 3: {
          if (tag !== 25) {
            break;
          }

          message.availableBytes = reader.double();
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

  fromJSON(object: any): ChalkKubernetesPersistentVolumeMetrics {
    return {
      capacityBytes: isSet(object.capacityBytes) ? globalThis.Number(object.capacityBytes) : 0,
      usedBytes: isSet(object.usedBytes) ? globalThis.Number(object.usedBytes) : 0,
      availableBytes: isSet(object.availableBytes) ? globalThis.Number(object.availableBytes) : 0,
    };
  },

  toJSON(message: ChalkKubernetesPersistentVolumeMetrics): unknown {
    const obj: any = {};
    if (message.capacityBytes !== 0) {
      obj.capacityBytes = message.capacityBytes;
    }
    if (message.usedBytes !== 0) {
      obj.usedBytes = message.usedBytes;
    }
    if (message.availableBytes !== 0) {
      obj.availableBytes = message.availableBytes;
    }
    return obj;
  },
};

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
}
