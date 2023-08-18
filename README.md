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
import { ChalkClient } from "@chalk-ai/client";

// Import your generated types (recommended)
import { FeaturesType } from "local/generated_types";

// Alternatively, define features you want to pull using the client
// as an interface with the feature type and feature name.
interface FeaturesType {
  "user.id": string;
  "user.socure_score": number;
}

const client = new ChalkClient<FeaturesType>();

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
var ChalkClient = require("@chalk-ai/client").ChalkClient;

interface FeaturesType {
  "user.id": string;
  "user.socure_score": number;
}

var client = new ChalkClient<FeaturesType>();

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

## Constructor options

```ts
new ChalkClient({
  /**
   * Your Chalk Client ID. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
   *
   * If not specified and unset by your environment, an error will be thrown on client creation
   */
  clientId?: string;

  /**
   * Your Chalk Client Secret. This value will be read from the _CHALK_CLIENT_ID environment variable if not set explicitly.
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
   * Tracing options that will be forwarded to the OTLP Trace Exporter. Traces are exported using http.
   * Traces can be exported to an OpenTelemetry collector and exported to any compatible tracing backend,
   * or can be exported to any compatible tracing backend directly.
   *
   * `url:` URL to export OpenTelemetry traces to. Defaults to http://localhost:4318/v1/traces.
   * If not specified, will use the environment variable _CHALK_TRACING_EXPORT_URL.
   *
   * `headers:` Headers to send with the trace http requests.
   *
   * `tracingActive:` Boolean that indicates whether to collect and export traces. Defaults to `false`.
   * If not specified, will use the environment variable _CHALK_TRACING_ACTIVE.
   */
  tracingOptions?: TracingOptions;

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
})
```

### Supported environment variables

| Variable                                | Kind         | Description                                                                                                                                      |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `process.env._CHALK_CLIENT_ID`          | **Required** | Your Chalk client ID. You must specify this environment variable or pass an explicit `clientId` value when constructing your ChalkClient         |
| `process.env._CHALK_CLIENT_SECRET`      | **Required** | Your Chalk client secret. You must specify this environment variable or pass an explicit `clientSecret` value when constructing your ChalkClient |
| `process.env._CHALK_ACTIVE_ENVIRONMENT` | Optional     | The environment that your client should connect to. If not specified, the client will query your project's default environment                   |
| `process.env._CHALK_API_SERVER`         | Optional     | The API server that the client will communicate with. This defaults to https://api.chalk.ai which should be sufficient for most consumers        |
| `process.env._CHALK_TRACING_EXPORT_URL` | Optional     | The url you would like your client to export OpenTelemetry traces to. This defaults to http://localhost:4318/v1/traces.                          |
| `process.env._CHALK_TRACING_ACTIVE`     | Optional     | Boolean indicating whether the client should collect and export trace data. This defaults to `false`                                             |

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
