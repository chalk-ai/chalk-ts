# @chalk-ai/client

[![npm version](https://img.shields.io/npm/v/@chalk-ai/client?label=%40chalk-ai%2Fclient&logo=npm)](https://www.npmjs.com/package/@chalk-ai/client)
![CI](https://img.shields.io/github/actions/workflow/status/chalk-ai/chalk-ts/check.yml?branch=main)

TypeScript client for Chalk.

## Installation

```sh
$ yarn add @chalk-ai/client
```

## Generate Types

Starting in your Chalk project directory, run:

```sh
$ chalk codegen typescript --out=generated_types.ts
```

## Usage

### Modern JavaScript ES6

```ts
import { ChalkGRPCCLient } from "@chalk-ai/client"
// import { ChalkClient } from "@chalk-ai/client";

// Import your generated types (recommended)
import { FeaturesType } from "local/generated_types";

// Alternatively, define features you want to pull using the client
// as an interface with the feature type and feature name.
interface FeaturesType {
  "user.id": string;
  "user.socure_score": number;
}

const client = new ChalkGRPCCLient<FeaturesType>();

const result = await client.query({
  inputs: {
    "user.id": "1",
  },
  outputs: ["user.socure_score"],
});

// The property `.data` has auto-complete based on the
// list provided in `output` above. So if you try to pull
// a feature that wasn't requested, you will see an error
// in type checking.
console.log(result.data["user.socure_score"].value);
```

### CommonJS

```ts
var ChalkGRPCClient = require("@chalk-ai/client").ChalkGRPCClient;
// var ChalkClient = require("@chalk-ai/client").ChalkClient; 

interface FeaturesType {
  "user.id": string;
  "user.socure_score": number;
}

var client = new ChalkGRPCCLient<FeaturesType>();

client
  .query({
    inputs: {
      "user.id": "1",
    },
    outputs: ["user.socure_score"],
  })
  .then((result) => {
    console.log(result.data["user.socure_score"].value);
  });
```

## Constructor options (gRPC)

See [the HTTP Options](#constructor-options-legacy) if you are using the HTTP Client, but we encourage
reading the [migration guide](#migrating-to-the-grpc-client).

```ts
import { ChalkGRPCCLient } from "@chalk-ai/client"

const options: ChalkGRPCClientOpts = {/* ... */ }
const chalkClient = new ChalkGRPCClient(options)

export interface ChalkGRPCClientOpts {
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
   * The environment that your client will run against. This value will be read from the _CHALK_ACTIVE_ENVIRONMENT environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  activeEnvironment?: string;

  /**
   * A custom fetch client that will replace the fetch polyfill used by default. Used by both the HTTP and gRPC
   * clients - the HTTP client for all calls, and the gRPC client for fetching credentials from the API server.
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
  timestampFormat?: TimestampFormat.ISO_8601 | TimestampFormat.EPOCH_MILLIS;

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
   * Passed to the internal grpc client upon initialization. Under the hood, Chalk uses the @grpc/grpc-js library
   * and this allows users finer control of their gRPC usage.
   *
   * See https://grpc.github.io/grpc/node/grpc.Client.html for more information on what is supported here.
   */
  grpcClientOptions?: Partial<ClientOptions>;
}
```

## Migrating to the gRPC Client

While Chalk supports both an HTTP Client and a gRPC Client for interfacing with Chalk, we heavily encourage users to use 
the gRPC Client for better performance, as this targets a more performant gRPC Query Server. After setting up a gRPC 
Query Server in your Chalk Environment, changing to the gRPC Client can be done in a few steps:

- Use the import `ChalkGRPCClient` instead of `ChalkClient`
- Check to see if any of the following initialization options need to be changed:
  - The option `useQueryServerFromCredentialExchange` has been changed to `skipQueryServerFromCredentialExchange` 
    and *negated* to better reflect the default behavior for the gRPC Query Server.
  - It is most likely not necessary to change a provided `QueryServer` as most routing is done via SDK-set headers, but 
    depending on your setup this may need to be directly specified if using a non-standard port - the gRPC query server listens
    on port `443` by default.
  - It is **not** necessary to remove the `fetch` or `fetchHeaders` as these are still used during some HTTP routines
    such as fetching credentials.

After these initialization changes are made, no changes to actual calls should be necessary - the gRPC Client uses the
same function signatures.

At this moment, only `query()`, `queryBulk()`, and `multiQuery()` are supported - if your usage requires one of the other 
functions (`whoami()`, `triggerResolverRun()`, `uploadSingle()`, `getRunStatus()`), the legacy `ChalkClient` should be used
(but ideally only for these four calls - we still strongly recommend partially migrating the query calls to the gRPC Client).



### Supported environment variables

| Variable                                | Kind         | Description                                                                                                                                      |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `process.env._CHALK_CLIENT_ID`          | **Required** | Your Chalk client ID. You must specify this environment variable or pass an explicit `clientId` value when constructing your ChalkClient         |
| `process.env._CHALK_CLIENT_SECRET`      | **Required** | Your Chalk client secret. You must specify this environment variable or pass an explicit `clientSecret` value when constructing your ChalkClient |
| `process.env._CHALK_ACTIVE_ENVIRONMENT` | Optional     | The environment that your client should connect to. If not specified, the client will query your project's default environment                   |
| `process.env._CHALK_API_SERVER`         | Optional     | The API server that the client will communicate with. This defaults to https://api.chalk.ai which should be sufficient for most consumers        |

You can find relevant variables to use with your Chalk Client by
running `chalk config` with the Chalk command line tool.

```sh
$ chalk config

Path:          ~~~
Name:          Organization Token
Client Id:     <client-id>
Client Secret: <client-secret>
Environment:   <active-environment>
API Server:    https://api.chalk.ai
Valid Until:   2023-11-10T06:11:17.516000
```

## Constructor options (Legacy)

```ts
import { ChalkCLient } from "@chalk-ai/client"

const options: ChalkClientOpts = {/* ... */}
const chalkClient = new ChalkClient(opts )

export interface ChalkClientOpts {
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
   * The environment that your client will run against. This value will be read from the _CHALK_ACTIVE_ENVIRONMENT environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  activeEnvironment?: string;

  /**
   * A custom fetch client that will replace the fetch polyfill used by default.
   *
   * If not provided, the client will use the default fetch polyfill (native fetch with node-fetch as a fallback).
   */
  fetch?: CustomFetchClient;

  /**
   * A custom fetch headers object that will replace the fetch Headers polyfill used by default.
   *
   * If not provided, the client will use the default fetch Headers polyfill (native fetch with node-fetch as a fallback).
   */
  fetchHeaders?: typeof Headers;

  /**
   * The format to use for date-type data.
   *
   * Defaults to "ISO_8601" (in UTC), also supports "EPOCH_MILLIS" as number of milliseconds since epoch
   */
  timestampFormat?: TimestampFormat.ISO_8601 | TimestampFormat.EPOCH_MILLIS;

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
```


