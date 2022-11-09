import { DEFAULT_API_SERVER } from "./_const";
import { ChalkWhoamiResponse } from "./_interface";
import { ChalkEnv, ChalkEnvironmentVariables } from "./_types";

interface Env {}

export interface ChalkClientOpts {
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
}


function valueWithEnvFallback(
  parameterNameForDebugging: string,
  constructorValue: string | undefined,
  name: keyof ChalkEnvironmentVariables,
) {
  if (constructorValue != null) {
    return constructorValue;
  }

  const envValue = process?.env?.[name];
  if (envValue != null && envValue !== "") {
    return envValue;
  }

  throw new Error(
    `Chalk client parameter '${parameterNameForDebugging}' was not specified when creating your ChalkClient, and was not present as '${name}' in process.env. This field is required to use Chalk`
  );
}

export class ChalkClient {
  private chalkEnv: ChalkEnv;

  constructor(opts?: {
    clientId?: string;
    clientSecret?: string;
    apiServer?: string;
    activeEnvironment?: string;
  }) {
    this.chalkEnv = {
      activeEnvironment: valueWithEnvFallback("activeEnvironment", opts?.activeEnvironment, "_CHALK_ACTIVE_ENVIRONMENT"),
      clientSecret: valueWithEnvFallback("clientSecret", opts?.clientSecret, "_CHALK_CLIENT_SECRET"),
      apiServer: opts?.apiServer ?? process.env._CHALK_API_SERVER ?? DEFAULT_API_SERVER,
      clientId: valueWithEnvFallback("clientId", opts?.clientId, "_CHALK_CLIENT_ID"),
    };
  }
}
