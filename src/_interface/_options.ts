import { ChalkHttpHeaders } from "./_header";
import { CustomFetchClient } from "./_types";
import { ChalkClientConfig } from "./_client";
import { ClientOptions } from "@grpc/grpc-js";

export interface BaseChalkClientOpts {
  /**
   * Your Chalk Client ID. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientId?: string;

  /**
   * Your Chalk Client Secret. This value will be read from the _CHALK_CLIENT_SECRET environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientSecret?: string;

  /**
   * The URL of your chalk API server. Defaults to https://api.chalk.ai
   */
  apiServer?: string;

  /**
   * For customers with isolated query infrastructure, the URL of the server to direct query-related traffic to.
   * Authentication and metadata plane traffic will continue to route to apiServer.
   */
  queryServer?: string;

  /**
   * The environment that your client will run against.
   * This value will be read from the _CHALK_ACTIVE_ENVIRONMENT environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  activeEnvironment?: string;

  /**
   * If specified, Chalk will route all requests from this client instance to the relevant branch.
   * This value will be read from the _CHALK_BRANCH environment variable if not set explicitly.
   *
   * Some methods allow you to override this instance-level branch configuration by passing in a `branch` argument.
   */
  branch?: string;

  /**
   * Additional headers to include in all requests made by this client instance.
   */
  additionalHeaders?: ChalkHttpHeaders;

  defaultTimeout?: number;

  /**
   * A custom fetch client that will replace the fetch polyfill used by default.
   *
   * If not provided, the client will use the default fetch polyfill (native fetch with node-fetch as a fallback).
   */
  fetch?: CustomFetchClient;

  /**
   * A custom fetch headers object that will replace the fetch Headers polyfill used by default. This is primarily for use
   * with a custom fetch client, and is not the preferred way to add additional headers to requests.
   *
   * If not provided, the client will use the default fetch Headers polyfill (native fetch with node-fetch as a fallback).
   */
  fetchHeaders?: typeof Headers;

  /**
   * The format to use for date-type data.
   *
   * Defaults to "ISO_8601" (in UTC), also supports "EPOCH_MILLIS" as number of milliseconds since epoch
   */
  timestampFormat?: ChalkClientConfig["timestampFormat"];
}

export interface ChalkClientOpts extends BaseChalkClientOpts {
  /**
   * If true, will try to directly connect to the query client using the metadata provided during
   * credentials exchange, which returns a mapping between environment and query server.
   *
   * The queryServer option will take precedence over this option (i.e. this option is essentially useless).
   *
   * Defaults to false, the legacy behavior of this client. This will change at the next major release.
   */
  useQueryServerFromCredentialExchange?: boolean;
}

export interface ChalkGRPCClientOpts extends BaseChalkClientOpts {
  /**
   * By default, the client will try to directly connect to the query client using the metadata provided during
   * credentials exchange, which returns a mapping between environment and query server. If this option is
   * truthy, the client will skip this step.
   *
   * The queryServer option will take precedence over this option (i.e. this option is essentially useless).
   * *
   * Defaults to false.
   */
  skipQueryServerFromCredentialExchange?: boolean;

  /**
   * Passed to the grpc client upon initialization. Under the hood, Chalk uses the @grpc/grpc-js library
   * and this allows users finer control of their gRPC usage.
   *
   * Note that
   */
  grpcClientOptions: Partial<ClientOptions>;
}
