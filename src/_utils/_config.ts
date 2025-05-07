import { BaseChalkClientOpts } from "../_interface/_options";
import { ChalkClientConfig, TimestampFormat } from "../_interface";
import { DEFAULT_API_SERVER } from "../_const";
import { ChalkEnvironmentVariables } from "../_interface/_types";

function valueWithEnvFallback(
  parameterNameForDebugging: string,
  constructorValue: string | undefined,
  name: keyof ChalkEnvironmentVariables
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

export const configFromOptionsAndEnvironment = (
  opts?: BaseChalkClientOpts
): ChalkClientConfig => {
  const resolvedApiServer: string =
    opts?.apiServer ?? process.env._CHALK_API_SERVER ?? DEFAULT_API_SERVER;
  const queryServer: string | undefined =
    opts?.queryServer ?? process.env._CHALK_QUERY_SERVER;

  return {
    activeEnvironment:
      opts?.activeEnvironment ??
      process.env._CHALK_ACTIVE_ENVIRONMENT ??
      undefined,
    apiServer: resolvedApiServer,
    branch: opts?.branch ?? process.env._CHALK_BRANCH ?? undefined,
    clientId: valueWithEnvFallback(
      "clientId",
      opts?.clientId,
      "_CHALK_CLIENT_ID"
    ),
    clientSecret: valueWithEnvFallback(
      "clientSecret",
      opts?.clientSecret,
      "_CHALK_CLIENT_SECRET"
    ),
    queryServer,
    timestampFormat: opts?.timestampFormat ?? TimestampFormat.ISO_8601,
    // Note: this diverges between opts, override!
    useQueryServerFromCredentialExchange: true,
  };
};
