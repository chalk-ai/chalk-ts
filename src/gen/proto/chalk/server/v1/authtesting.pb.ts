// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v2.6.1
//   protoc               unknown
// source: chalk/server/v1/authtesting.proto

/* eslint-disable */
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
import {
  type CallOptions,
  ChannelCredentials,
  Client,
  type ClientOptions,
  type ClientUnaryCall,
  type handleUnaryCall,
  makeGenericClientConstructor,
  Metadata,
  type ServiceError,
  type UntypedServiceImplementation,
} from "@grpc/grpc-js";

export const protobufPackage = "chalk.server.v1";

export interface GetUnauthedTestEndpointRequest {
}

export interface GetAuthedTestEndpointRequest {
}

export interface GetViewerTestEndpointRequest {
}

export interface GetDataScientistTestEndpointRequest {
}

export interface GetDeveloperTestEndpointRequest {
}

export interface GetAdminTestEndpointRequest {
}

export interface GetOwnerTestEndpointRequest {
}

export interface GetUnauthedTestEndpointResponse {
}

export interface GetAuthedTestEndpointResponse {
}

export interface GetViewerTestEndpointResponse {
}

export interface GetDataScientistTestEndpointResponse {
}

export interface GetDeveloperTestEndpointResponse {
}

export interface GetAdminTestEndpointResponse {
}

export interface GetOwnerTestEndpointResponse {
}

function createBaseGetUnauthedTestEndpointRequest(): GetUnauthedTestEndpointRequest {
  return {};
}

export const GetUnauthedTestEndpointRequest: MessageFns<GetUnauthedTestEndpointRequest> = {
  encode(_: GetUnauthedTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetUnauthedTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUnauthedTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetUnauthedTestEndpointRequest {
    return {};
  },

  toJSON(_: GetUnauthedTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetAuthedTestEndpointRequest(): GetAuthedTestEndpointRequest {
  return {};
}

export const GetAuthedTestEndpointRequest: MessageFns<GetAuthedTestEndpointRequest> = {
  encode(_: GetAuthedTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetAuthedTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAuthedTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetAuthedTestEndpointRequest {
    return {};
  },

  toJSON(_: GetAuthedTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetViewerTestEndpointRequest(): GetViewerTestEndpointRequest {
  return {};
}

export const GetViewerTestEndpointRequest: MessageFns<GetViewerTestEndpointRequest> = {
  encode(_: GetViewerTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetViewerTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetViewerTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetViewerTestEndpointRequest {
    return {};
  },

  toJSON(_: GetViewerTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetDataScientistTestEndpointRequest(): GetDataScientistTestEndpointRequest {
  return {};
}

export const GetDataScientistTestEndpointRequest: MessageFns<GetDataScientistTestEndpointRequest> = {
  encode(_: GetDataScientistTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetDataScientistTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDataScientistTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetDataScientistTestEndpointRequest {
    return {};
  },

  toJSON(_: GetDataScientistTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetDeveloperTestEndpointRequest(): GetDeveloperTestEndpointRequest {
  return {};
}

export const GetDeveloperTestEndpointRequest: MessageFns<GetDeveloperTestEndpointRequest> = {
  encode(_: GetDeveloperTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetDeveloperTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDeveloperTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetDeveloperTestEndpointRequest {
    return {};
  },

  toJSON(_: GetDeveloperTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetAdminTestEndpointRequest(): GetAdminTestEndpointRequest {
  return {};
}

export const GetAdminTestEndpointRequest: MessageFns<GetAdminTestEndpointRequest> = {
  encode(_: GetAdminTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetAdminTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAdminTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetAdminTestEndpointRequest {
    return {};
  },

  toJSON(_: GetAdminTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetOwnerTestEndpointRequest(): GetOwnerTestEndpointRequest {
  return {};
}

export const GetOwnerTestEndpointRequest: MessageFns<GetOwnerTestEndpointRequest> = {
  encode(_: GetOwnerTestEndpointRequest, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetOwnerTestEndpointRequest {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetOwnerTestEndpointRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetOwnerTestEndpointRequest {
    return {};
  },

  toJSON(_: GetOwnerTestEndpointRequest): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetUnauthedTestEndpointResponse(): GetUnauthedTestEndpointResponse {
  return {};
}

export const GetUnauthedTestEndpointResponse: MessageFns<GetUnauthedTestEndpointResponse> = {
  encode(_: GetUnauthedTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetUnauthedTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetUnauthedTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetUnauthedTestEndpointResponse {
    return {};
  },

  toJSON(_: GetUnauthedTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetAuthedTestEndpointResponse(): GetAuthedTestEndpointResponse {
  return {};
}

export const GetAuthedTestEndpointResponse: MessageFns<GetAuthedTestEndpointResponse> = {
  encode(_: GetAuthedTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetAuthedTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAuthedTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetAuthedTestEndpointResponse {
    return {};
  },

  toJSON(_: GetAuthedTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetViewerTestEndpointResponse(): GetViewerTestEndpointResponse {
  return {};
}

export const GetViewerTestEndpointResponse: MessageFns<GetViewerTestEndpointResponse> = {
  encode(_: GetViewerTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetViewerTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetViewerTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetViewerTestEndpointResponse {
    return {};
  },

  toJSON(_: GetViewerTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetDataScientistTestEndpointResponse(): GetDataScientistTestEndpointResponse {
  return {};
}

export const GetDataScientistTestEndpointResponse: MessageFns<GetDataScientistTestEndpointResponse> = {
  encode(_: GetDataScientistTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetDataScientistTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDataScientistTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetDataScientistTestEndpointResponse {
    return {};
  },

  toJSON(_: GetDataScientistTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetDeveloperTestEndpointResponse(): GetDeveloperTestEndpointResponse {
  return {};
}

export const GetDeveloperTestEndpointResponse: MessageFns<GetDeveloperTestEndpointResponse> = {
  encode(_: GetDeveloperTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetDeveloperTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetDeveloperTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetDeveloperTestEndpointResponse {
    return {};
  },

  toJSON(_: GetDeveloperTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetAdminTestEndpointResponse(): GetAdminTestEndpointResponse {
  return {};
}

export const GetAdminTestEndpointResponse: MessageFns<GetAdminTestEndpointResponse> = {
  encode(_: GetAdminTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetAdminTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetAdminTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetAdminTestEndpointResponse {
    return {};
  },

  toJSON(_: GetAdminTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

function createBaseGetOwnerTestEndpointResponse(): GetOwnerTestEndpointResponse {
  return {};
}

export const GetOwnerTestEndpointResponse: MessageFns<GetOwnerTestEndpointResponse> = {
  encode(_: GetOwnerTestEndpointResponse, writer: BinaryWriter = new BinaryWriter()): BinaryWriter {
    return writer;
  },

  decode(input: BinaryReader | Uint8Array, length?: number): GetOwnerTestEndpointResponse {
    const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseGetOwnerTestEndpointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skip(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): GetOwnerTestEndpointResponse {
    return {};
  },

  toJSON(_: GetOwnerTestEndpointResponse): unknown {
    const obj: any = {};
    return obj;
  },
};

export type AuthTestingServiceService = typeof AuthTestingServiceService;
export const AuthTestingServiceService = {
  getUnauthedTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetUnauthedTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetUnauthedTestEndpointRequest) =>
      Buffer.from(GetUnauthedTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetUnauthedTestEndpointRequest.decode(value),
    responseSerialize: (value: GetUnauthedTestEndpointResponse) =>
      Buffer.from(GetUnauthedTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetUnauthedTestEndpointResponse.decode(value),
  },
  getAuthedTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetAuthedTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetAuthedTestEndpointRequest) =>
      Buffer.from(GetAuthedTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetAuthedTestEndpointRequest.decode(value),
    responseSerialize: (value: GetAuthedTestEndpointResponse) =>
      Buffer.from(GetAuthedTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetAuthedTestEndpointResponse.decode(value),
  },
  getViewerTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetViewerTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetViewerTestEndpointRequest) =>
      Buffer.from(GetViewerTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetViewerTestEndpointRequest.decode(value),
    responseSerialize: (value: GetViewerTestEndpointResponse) =>
      Buffer.from(GetViewerTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetViewerTestEndpointResponse.decode(value),
  },
  getDataScientistTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetDataScientistTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetDataScientistTestEndpointRequest) =>
      Buffer.from(GetDataScientistTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetDataScientistTestEndpointRequest.decode(value),
    responseSerialize: (value: GetDataScientistTestEndpointResponse) =>
      Buffer.from(GetDataScientistTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetDataScientistTestEndpointResponse.decode(value),
  },
  getDeveloperTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetDeveloperTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetDeveloperTestEndpointRequest) =>
      Buffer.from(GetDeveloperTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetDeveloperTestEndpointRequest.decode(value),
    responseSerialize: (value: GetDeveloperTestEndpointResponse) =>
      Buffer.from(GetDeveloperTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetDeveloperTestEndpointResponse.decode(value),
  },
  getAdminTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetAdminTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetAdminTestEndpointRequest) =>
      Buffer.from(GetAdminTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetAdminTestEndpointRequest.decode(value),
    responseSerialize: (value: GetAdminTestEndpointResponse) =>
      Buffer.from(GetAdminTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetAdminTestEndpointResponse.decode(value),
  },
  getOwnerTestEndpoint: {
    path: "/chalk.server.v1.AuthTestingService/GetOwnerTestEndpoint",
    requestStream: false,
    responseStream: false,
    requestSerialize: (value: GetOwnerTestEndpointRequest) =>
      Buffer.from(GetOwnerTestEndpointRequest.encode(value).finish()),
    requestDeserialize: (value: Buffer) => GetOwnerTestEndpointRequest.decode(value),
    responseSerialize: (value: GetOwnerTestEndpointResponse) =>
      Buffer.from(GetOwnerTestEndpointResponse.encode(value).finish()),
    responseDeserialize: (value: Buffer) => GetOwnerTestEndpointResponse.decode(value),
  },
} as const;

export interface AuthTestingServiceServer extends UntypedServiceImplementation {
  getUnauthedTestEndpoint: handleUnaryCall<GetUnauthedTestEndpointRequest, GetUnauthedTestEndpointResponse>;
  getAuthedTestEndpoint: handleUnaryCall<GetAuthedTestEndpointRequest, GetAuthedTestEndpointResponse>;
  getViewerTestEndpoint: handleUnaryCall<GetViewerTestEndpointRequest, GetViewerTestEndpointResponse>;
  getDataScientistTestEndpoint: handleUnaryCall<
    GetDataScientistTestEndpointRequest,
    GetDataScientistTestEndpointResponse
  >;
  getDeveloperTestEndpoint: handleUnaryCall<GetDeveloperTestEndpointRequest, GetDeveloperTestEndpointResponse>;
  getAdminTestEndpoint: handleUnaryCall<GetAdminTestEndpointRequest, GetAdminTestEndpointResponse>;
  getOwnerTestEndpoint: handleUnaryCall<GetOwnerTestEndpointRequest, GetOwnerTestEndpointResponse>;
}

export interface AuthTestingServiceClient extends Client {
  getUnauthedTestEndpoint(
    request: GetUnauthedTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetUnauthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getUnauthedTestEndpoint(
    request: GetUnauthedTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetUnauthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getUnauthedTestEndpoint(
    request: GetUnauthedTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetUnauthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAuthedTestEndpoint(
    request: GetAuthedTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetAuthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAuthedTestEndpoint(
    request: GetAuthedTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetAuthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAuthedTestEndpoint(
    request: GetAuthedTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetAuthedTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getViewerTestEndpoint(
    request: GetViewerTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetViewerTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getViewerTestEndpoint(
    request: GetViewerTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetViewerTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getViewerTestEndpoint(
    request: GetViewerTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetViewerTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDataScientistTestEndpoint(
    request: GetDataScientistTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetDataScientistTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDataScientistTestEndpoint(
    request: GetDataScientistTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetDataScientistTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDataScientistTestEndpoint(
    request: GetDataScientistTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetDataScientistTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDeveloperTestEndpoint(
    request: GetDeveloperTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetDeveloperTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDeveloperTestEndpoint(
    request: GetDeveloperTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetDeveloperTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getDeveloperTestEndpoint(
    request: GetDeveloperTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetDeveloperTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAdminTestEndpoint(
    request: GetAdminTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetAdminTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAdminTestEndpoint(
    request: GetAdminTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetAdminTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getAdminTestEndpoint(
    request: GetAdminTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetAdminTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getOwnerTestEndpoint(
    request: GetOwnerTestEndpointRequest,
    callback: (error: ServiceError | null, response: GetOwnerTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getOwnerTestEndpoint(
    request: GetOwnerTestEndpointRequest,
    metadata: Metadata,
    callback: (error: ServiceError | null, response: GetOwnerTestEndpointResponse) => void,
  ): ClientUnaryCall;
  getOwnerTestEndpoint(
    request: GetOwnerTestEndpointRequest,
    metadata: Metadata,
    options: Partial<CallOptions>,
    callback: (error: ServiceError | null, response: GetOwnerTestEndpointResponse) => void,
  ): ClientUnaryCall;
}

export const AuthTestingServiceClient = makeGenericClientConstructor(
  AuthTestingServiceService,
  "chalk.server.v1.AuthTestingService",
) as unknown as {
  new (address: string, credentials: ChannelCredentials, options?: Partial<ClientOptions>): AuthTestingServiceClient;
  service: typeof AuthTestingServiceService;
  serviceName: string;
};

export interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
  fromJSON(object: any): T;
  toJSON(message: T): unknown;
}
