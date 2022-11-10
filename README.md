# @chalk-ai/client

![CI](https://github.com/chalk-ai/chalk-ts/actions/workflows/check.yml/badge.svg?branch=main)
[![npm version](https://badge.fury.io/js/@chalk-ai%2Fclient.svg)](https://badge.fury.io/js/@chalk-ai%2Fclient)

TypeScript client for Chalk.

## Installation

```sh
$ yarn add @chalk-ai/client
```

## Usage

### Modern JavaScript ES6

```ts
import { ChalkClient } from "@chalk-ai/client";

interface Features {
  "user.id": string;
  "user.socure_score": number;
}

const client = new ChalkClient<Features>();

const result = await client.query({
  inputs: {
    "user.id": "1",
  },
  outputs: ["user.socure_score"],
});

console.log(result.data["user.socure_score"].value);
```

### CommonJS

```ts
var ChalkClient = require("@chalk-ai/client").ChalkClient;

interface Features {
  "user.id": string;
  "user.socure_score": number;
}

var client = new ChalkClient<Features>();

client.query({
  inputs: {
    "user.id": "1",
  },
  outputs: ["user.socure_score"],
}).then((result) => {
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
})
```

### Supported environment variables

| Variable      | Kind | Description |
| ------------- | ---- | ------------- |
| `process.env._CHALK_CLIENT_ID`  | **Required** | Your Chalk client ID. You must specify this environment variable or pass an explicit `clientId` value when constructing your ChalkClient |
| `process.env._CHALK_CLIENT_SECRET` | **Required** | Your Chalk client secret. You must specify this environment variable or pass an explicit `clientSecret` value when constructing your ChalkClient |
| `process.env._CHALK_ACTIVE_ENVIRONMENT` | Optional | The environment that your client should connect to. If not specified, the client will query your project's default environment |
| `process.env._CHALK_API_SERVER` | Optional | The API server that the client will communicate with. This defaults to https://api.chalk.ai which should be sufficient for most consumers |

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
