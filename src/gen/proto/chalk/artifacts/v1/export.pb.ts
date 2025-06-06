// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               unknown
// source: chalk/artifacts/v1/export.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import { ChalkError } from "../../common/v1/chalk_error.pb";
import { Graph } from "../../graph/v1/graph.pb";
import { LSP } from "../../lsp/v1/lsp.pb";
import { CDCSource } from "./cdc.pb";
import { Chart } from "./chart.pb";
import { CronQuery } from "./cron_query.pb";

export const protobufPackage = "chalk.artifacts.v1";

export enum ValidationLogSeverity {
  VALIDATION_LOG_SEVERITY_UNSPECIFIED = 0,
  /**
   * VALIDATION_LOG_SEVERITY_INFO - Space field numbers out in case we need to add more
   * levels and have it be numerically congruent.
   */
  VALIDATION_LOG_SEVERITY_INFO = 4,
  VALIDATION_LOG_SEVERITY_WARNING = 8,
  VALIDATION_LOG_SEVERITY_ERROR = 12,
  UNRECOGNIZED = -1,
}

export function validationLogSeverityFromJSON(object: any): ValidationLogSeverity {
  switch (object) {
    case 0:
    case "VALIDATION_LOG_SEVERITY_UNSPECIFIED":
      return ValidationLogSeverity.VALIDATION_LOG_SEVERITY_UNSPECIFIED;
    case 4:
    case "VALIDATION_LOG_SEVERITY_INFO":
      return ValidationLogSeverity.VALIDATION_LOG_SEVERITY_INFO;
    case 8:
    case "VALIDATION_LOG_SEVERITY_WARNING":
      return ValidationLogSeverity.VALIDATION_LOG_SEVERITY_WARNING;
    case 12:
    case "VALIDATION_LOG_SEVERITY_ERROR":
      return ValidationLogSeverity.VALIDATION_LOG_SEVERITY_ERROR;
    case -1:
    case "UNRECOGNIZED":
    default:
      return ValidationLogSeverity.UNRECOGNIZED;
  }
}

export function validationLogSeverityToJSON(object: ValidationLogSeverity): string {
  switch (object) {
    case ValidationLogSeverity.VALIDATION_LOG_SEVERITY_UNSPECIFIED:
      return "VALIDATION_LOG_SEVERITY_UNSPECIFIED";
    case ValidationLogSeverity.VALIDATION_LOG_SEVERITY_INFO:
      return "VALIDATION_LOG_SEVERITY_INFO";
    case ValidationLogSeverity.VALIDATION_LOG_SEVERITY_WARNING:
      return "VALIDATION_LOG_SEVERITY_WARNING";
    case ValidationLogSeverity.VALIDATION_LOG_SEVERITY_ERROR:
      return "VALIDATION_LOG_SEVERITY_ERROR";
    case ValidationLogSeverity.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface EnvironmentSettings {
  id: string;
  runtime?: string | undefined;
  requirements?: string | undefined;
  dockerfile?: string | undefined;
  requiresPackages: string[];
  platformVersion?: string | undefined;
}

export interface ProjectSettings {
  project: string;
  environments: EnvironmentSettings[];
  validation: ValidationSettings | undefined;
}

export interface MetadataSettings {
  name: string;
  missing: string;
}

export interface FeatureSettings {
  metadata: MetadataSettings[];
}

export interface ResolverSettings {
  metadata: MetadataSettings[];
}

export interface ValidationSettings {
  feature: FeatureSettings | undefined;
  resolver: ResolverSettings | undefined;
}

export interface FailedImport {
  fileName: string;
  module: string;
  traceback: string;
}

export interface ChalkpyInfo {
  version: string;
  python?: string | undefined;
}

export interface ValidationLog {
  header: string;
  subheader: string;
  severity: ValidationLogSeverity;
}

export interface Export {
  graph: Graph | undefined;
  crons: CronQuery[];
  charts: Chart[];
  cdcSources: CDCSource[];
  config: ProjectSettings | undefined;
  chalkpy: ChalkpyInfo | undefined;
  failed: FailedImport[];
  logs: ValidationLog[];
  lsp: LSP | undefined;
  conversionErrors: ChalkError[];
}

function createBaseEnvironmentSettings(): EnvironmentSettings {
  return {
    id: "",
    runtime: undefined,
    requirements: undefined,
    dockerfile: undefined,
    requiresPackages: [],
    platformVersion: undefined,
  };
}

export const EnvironmentSettings: MessageFns<EnvironmentSettings> = {
  encode(message: EnvironmentSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.runtime !== undefined) {
      writer.uint32(18).string(message.runtime);
    }
    if (message.requirements !== undefined) {
      writer.uint32(26).string(message.requirements);
    }
    if (message.dockerfile !== undefined) {
      writer.uint32(34).string(message.dockerfile);
    }
    for (const v of message.requiresPackages) {
      writer.uint32(42).string(v!);
    }
    if (message.platformVersion !== undefined) {
      writer.uint32(50).string(message.platformVersion);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): EnvironmentSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEnvironmentSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.runtime = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.requirements = reader.string();
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }

          message.dockerfile = reader.string();
          continue;
        }
        case 5: {
          if (tag !== 42) {
            break;
          }

          message.requiresPackages.push(reader.string());
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }

          message.platformVersion = reader.string();
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

  fromJSON(object: any): EnvironmentSettings {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      runtime: isSet(object.runtime) ? globalThis.String(object.runtime) : undefined,
      requirements: isSet(object.requirements) ? globalThis.String(object.requirements) : undefined,
      dockerfile: isSet(object.dockerfile) ? globalThis.String(object.dockerfile) : undefined,
      requiresPackages: globalThis.Array.isArray(object?.requiresPackages)
        ? object.requiresPackages.map((e: any) => globalThis.String(e))
        : [],
      platformVersion: isSet(object.platformVersion) ? globalThis.String(object.platformVersion) : undefined,
    };
  },

  toJSON(message: EnvironmentSettings): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.runtime !== undefined) {
      obj.runtime = message.runtime;
    }
    if (message.requirements !== undefined) {
      obj.requirements = message.requirements;
    }
    if (message.dockerfile !== undefined) {
      obj.dockerfile = message.dockerfile;
    }
    if (message.requiresPackages?.length) {
      obj.requiresPackages = message.requiresPackages;
    }
    if (message.platformVersion !== undefined) {
      obj.platformVersion = message.platformVersion;
    }
    return obj;
  },
};

function createBaseProjectSettings(): ProjectSettings {
  return { project: "", environments: [], validation: undefined };
}

export const ProjectSettings: MessageFns<ProjectSettings> = {
  encode(message: ProjectSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.project !== "") {
      writer.uint32(10).string(message.project);
    }
    for (const v of message.environments) {
      EnvironmentSettings.encode(v!, writer.uint32(18).fork()).join();
    }
    if (message.validation !== undefined) {
      ValidationSettings.encode(message.validation, writer.uint32(26).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ProjectSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseProjectSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.project = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.environments.push(EnvironmentSettings.decode(reader, reader.uint32()));
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.validation = ValidationSettings.decode(reader, reader.uint32());
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

  fromJSON(object: any): ProjectSettings {
    return {
      project: isSet(object.project) ? globalThis.String(object.project) : "",
      environments: globalThis.Array.isArray(object?.environments)
        ? object.environments.map((e: any) => EnvironmentSettings.fromJSON(e))
        : [],
      validation: isSet(object.validation) ? ValidationSettings.fromJSON(object.validation) : undefined,
    };
  },

  toJSON(message: ProjectSettings): unknown {
    const obj: any = {};
    if (message.project !== "") {
      obj.project = message.project;
    }
    if (message.environments?.length) {
      obj.environments = message.environments.map((e) => EnvironmentSettings.toJSON(e));
    }
    if (message.validation !== undefined) {
      obj.validation = ValidationSettings.toJSON(message.validation);
    }
    return obj;
  },
};

function createBaseMetadataSettings(): MetadataSettings {
  return { name: "", missing: "" };
}

export const MetadataSettings: MessageFns<MetadataSettings> = {
  encode(message: MetadataSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.missing !== "") {
      writer.uint32(18).string(message.missing);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): MetadataSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMetadataSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.name = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.missing = reader.string();
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

  fromJSON(object: any): MetadataSettings {
    return {
      name: isSet(object.name) ? globalThis.String(object.name) : "",
      missing: isSet(object.missing) ? globalThis.String(object.missing) : "",
    };
  },

  toJSON(message: MetadataSettings): unknown {
    const obj: any = {};
    if (message.name !== "") {
      obj.name = message.name;
    }
    if (message.missing !== "") {
      obj.missing = message.missing;
    }
    return obj;
  },
};

function createBaseFeatureSettings(): FeatureSettings {
  return { metadata: [] };
}

export const FeatureSettings: MessageFns<FeatureSettings> = {
  encode(message: FeatureSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.metadata) {
      MetadataSettings.encode(v!, writer.uint32(10).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): FeatureSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFeatureSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.metadata.push(MetadataSettings.decode(reader, reader.uint32()));
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

  fromJSON(object: any): FeatureSettings {
    return {
      metadata: globalThis.Array.isArray(object?.metadata)
        ? object.metadata.map((e: any) => MetadataSettings.fromJSON(e))
        : [],
    };
  },

  toJSON(message: FeatureSettings): unknown {
    const obj: any = {};
    if (message.metadata?.length) {
      obj.metadata = message.metadata.map((e) => MetadataSettings.toJSON(e));
    }
    return obj;
  },
};

function createBaseResolverSettings(): ResolverSettings {
  return { metadata: [] };
}

export const ResolverSettings: MessageFns<ResolverSettings> = {
  encode(message: ResolverSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    for (const v of message.metadata) {
      MetadataSettings.encode(v!, writer.uint32(10).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ResolverSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResolverSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.metadata.push(MetadataSettings.decode(reader, reader.uint32()));
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

  fromJSON(object: any): ResolverSettings {
    return {
      metadata: globalThis.Array.isArray(object?.metadata)
        ? object.metadata.map((e: any) => MetadataSettings.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ResolverSettings): unknown {
    const obj: any = {};
    if (message.metadata?.length) {
      obj.metadata = message.metadata.map((e) => MetadataSettings.toJSON(e));
    }
    return obj;
  },
};

function createBaseValidationSettings(): ValidationSettings {
  return { feature: undefined, resolver: undefined };
}

export const ValidationSettings: MessageFns<ValidationSettings> = {
  encode(message: ValidationSettings, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.feature !== undefined) {
      FeatureSettings.encode(message.feature, writer.uint32(10).fork()).join();
    }
    if (message.resolver !== undefined) {
      ResolverSettings.encode(message.resolver, writer.uint32(18).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ValidationSettings {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidationSettings();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.feature = FeatureSettings.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.resolver = ResolverSettings.decode(reader, reader.uint32());
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

  fromJSON(object: any): ValidationSettings {
    return {
      feature: isSet(object.feature) ? FeatureSettings.fromJSON(object.feature) : undefined,
      resolver: isSet(object.resolver) ? ResolverSettings.fromJSON(object.resolver) : undefined,
    };
  },

  toJSON(message: ValidationSettings): unknown {
    const obj: any = {};
    if (message.feature !== undefined) {
      obj.feature = FeatureSettings.toJSON(message.feature);
    }
    if (message.resolver !== undefined) {
      obj.resolver = ResolverSettings.toJSON(message.resolver);
    }
    return obj;
  },
};

function createBaseFailedImport(): FailedImport {
  return { fileName: "", module: "", traceback: "" };
}

export const FailedImport: MessageFns<FailedImport> = {
  encode(message: FailedImport, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.fileName !== "") {
      writer.uint32(10).string(message.fileName);
    }
    if (message.module !== "") {
      writer.uint32(18).string(message.module);
    }
    if (message.traceback !== "") {
      writer.uint32(26).string(message.traceback);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): FailedImport {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFailedImport();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.fileName = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.module = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.traceback = reader.string();
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

  fromJSON(object: any): FailedImport {
    return {
      fileName: isSet(object.fileName) ? globalThis.String(object.fileName) : "",
      module: isSet(object.module) ? globalThis.String(object.module) : "",
      traceback: isSet(object.traceback) ? globalThis.String(object.traceback) : "",
    };
  },

  toJSON(message: FailedImport): unknown {
    const obj: any = {};
    if (message.fileName !== "") {
      obj.fileName = message.fileName;
    }
    if (message.module !== "") {
      obj.module = message.module;
    }
    if (message.traceback !== "") {
      obj.traceback = message.traceback;
    }
    return obj;
  },
};

function createBaseChalkpyInfo(): ChalkpyInfo {
  return { version: "", python: undefined };
}

export const ChalkpyInfo: MessageFns<ChalkpyInfo> = {
  encode(message: ChalkpyInfo, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    if (message.python !== undefined) {
      writer.uint32(18).string(message.python);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ChalkpyInfo {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChalkpyInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.version = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.python = reader.string();
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

  fromJSON(object: any): ChalkpyInfo {
    return {
      version: isSet(object.version) ? globalThis.String(object.version) : "",
      python: isSet(object.python) ? globalThis.String(object.python) : undefined,
    };
  },

  toJSON(message: ChalkpyInfo): unknown {
    const obj: any = {};
    if (message.version !== "") {
      obj.version = message.version;
    }
    if (message.python !== undefined) {
      obj.python = message.python;
    }
    return obj;
  },
};

function createBaseValidationLog(): ValidationLog {
  return { header: "", subheader: "", severity: 0 };
}

export const ValidationLog: MessageFns<ValidationLog> = {
  encode(message: ValidationLog, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.header !== "") {
      writer.uint32(10).string(message.header);
    }
    if (message.subheader !== "") {
      writer.uint32(18).string(message.subheader);
    }
    if (message.severity !== 0) {
      writer.uint32(24).int32(message.severity);
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): ValidationLog {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseValidationLog();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.header = reader.string();
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.subheader = reader.string();
          continue;
        }
        case 3: {
          if (tag !== 24) {
            break;
          }

          message.severity = reader.int32() as any;
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

  fromJSON(object: any): ValidationLog {
    return {
      header: isSet(object.header) ? globalThis.String(object.header) : "",
      subheader: isSet(object.subheader) ? globalThis.String(object.subheader) : "",
      severity: isSet(object.severity) ? validationLogSeverityFromJSON(object.severity) : 0,
    };
  },

  toJSON(message: ValidationLog): unknown {
    const obj: any = {};
    if (message.header !== "") {
      obj.header = message.header;
    }
    if (message.subheader !== "") {
      obj.subheader = message.subheader;
    }
    if (message.severity !== 0) {
      obj.severity = validationLogSeverityToJSON(message.severity);
    }
    return obj;
  },
};

function createBaseExport(): Export {
  return {
    graph: undefined,
    crons: [],
    charts: [],
    cdcSources: [],
    config: undefined,
    chalkpy: undefined,
    failed: [],
    logs: [],
    lsp: undefined,
    conversionErrors: [],
  };
}

export const Export: MessageFns<Export> = {
  encode(message: Export, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    if (message.graph !== undefined) {
      Graph.encode(message.graph, writer.uint32(10).fork()).join();
    }
    for (const v of message.crons) {
      CronQuery.encode(v!, writer.uint32(18).fork()).join();
    }
    for (const v of message.charts) {
      Chart.encode(v!, writer.uint32(26).fork()).join();
    }
    for (const v of message.cdcSources) {
      CDCSource.encode(v!, writer.uint32(34).fork()).join();
    }
    if (message.config !== undefined) {
      ProjectSettings.encode(message.config, writer.uint32(42).fork()).join();
    }
    if (message.chalkpy !== undefined) {
      ChalkpyInfo.encode(message.chalkpy, writer.uint32(50).fork()).join();
    }
    for (const v of message.failed) {
      FailedImport.encode(v!, writer.uint32(58).fork()).join();
    }
    for (const v of message.logs) {
      ValidationLog.encode(v!, writer.uint32(66).fork()).join();
    }
    if (message.lsp !== undefined) {
      LSP.encode(message.lsp, writer.uint32(74).fork()).join();
    }
    for (const v of message.conversionErrors) {
      ChalkError.encode(v!, writer.uint32(82).fork()).join();
    }
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): Export {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseExport();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1: {
          if (tag !== 10) {
            break;
          }

          message.graph = Graph.decode(reader, reader.uint32());
          continue;
        }
        case 2: {
          if (tag !== 18) {
            break;
          }

          message.crons.push(CronQuery.decode(reader, reader.uint32()));
          continue;
        }
        case 3: {
          if (tag !== 26) {
            break;
          }

          message.charts.push(Chart.decode(reader, reader.uint32()));
          continue;
        }
        case 4: {
          if (tag !== 34) {
            break;
          }

          message.cdcSources.push(CDCSource.decode(reader, reader.uint32()));
          continue;
        }
        case 5: {
          if (tag !== 42) {
            break;
          }

          message.config = ProjectSettings.decode(reader, reader.uint32());
          continue;
        }
        case 6: {
          if (tag !== 50) {
            break;
          }

          message.chalkpy = ChalkpyInfo.decode(reader, reader.uint32());
          continue;
        }
        case 7: {
          if (tag !== 58) {
            break;
          }

          message.failed.push(FailedImport.decode(reader, reader.uint32()));
          continue;
        }
        case 8: {
          if (tag !== 66) {
            break;
          }

          message.logs.push(ValidationLog.decode(reader, reader.uint32()));
          continue;
        }
        case 9: {
          if (tag !== 74) {
            break;
          }

          message.lsp = LSP.decode(reader, reader.uint32());
          continue;
        }
        case 10: {
          if (tag !== 82) {
            break;
          }

          message.conversionErrors.push(ChalkError.decode(reader, reader.uint32()));
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

  fromJSON(object: any): Export {
    return {
      graph: isSet(object.graph) ? Graph.fromJSON(object.graph) : undefined,
      crons: globalThis.Array.isArray(object?.crons) ? object.crons.map((e: any) => CronQuery.fromJSON(e)) : [],
      charts: globalThis.Array.isArray(object?.charts) ? object.charts.map((e: any) => Chart.fromJSON(e)) : [],
      cdcSources: globalThis.Array.isArray(object?.cdcSources)
        ? object.cdcSources.map((e: any) => CDCSource.fromJSON(e))
        : [],
      config: isSet(object.config) ? ProjectSettings.fromJSON(object.config) : undefined,
      chalkpy: isSet(object.chalkpy) ? ChalkpyInfo.fromJSON(object.chalkpy) : undefined,
      failed: globalThis.Array.isArray(object?.failed) ? object.failed.map((e: any) => FailedImport.fromJSON(e)) : [],
      logs: globalThis.Array.isArray(object?.logs) ? object.logs.map((e: any) => ValidationLog.fromJSON(e)) : [],
      lsp: isSet(object.lsp) ? LSP.fromJSON(object.lsp) : undefined,
      conversionErrors: globalThis.Array.isArray(object?.conversionErrors)
        ? object.conversionErrors.map((e: any) => ChalkError.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Export): unknown {
    const obj: any = {};
    if (message.graph !== undefined) {
      obj.graph = Graph.toJSON(message.graph);
    }
    if (message.crons?.length) {
      obj.crons = message.crons.map((e) => CronQuery.toJSON(e));
    }
    if (message.charts?.length) {
      obj.charts = message.charts.map((e) => Chart.toJSON(e));
    }
    if (message.cdcSources?.length) {
      obj.cdcSources = message.cdcSources.map((e) => CDCSource.toJSON(e));
    }
    if (message.config !== undefined) {
      obj.config = ProjectSettings.toJSON(message.config);
    }
    if (message.chalkpy !== undefined) {
      obj.chalkpy = ChalkpyInfo.toJSON(message.chalkpy);
    }
    if (message.failed?.length) {
      obj.failed = message.failed.map((e) => FailedImport.toJSON(e));
    }
    if (message.logs?.length) {
      obj.logs = message.logs.map((e) => ValidationLog.toJSON(e));
    }
    if (message.lsp !== undefined) {
      obj.lsp = LSP.toJSON(message.lsp);
    }
    if (message.conversionErrors?.length) {
      obj.conversionErrors = message.conversionErrors.map((e) => ChalkError.toJSON(e));
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
