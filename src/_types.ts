import { TimestampFormat } from "./_interface";

export interface ChalkClientConfig {
  activeEnvironment: string | undefined;
  apiServer: string;
  branch: string | undefined;
  clientId: string;
  clientSecret: string;
  queryServer: string | undefined;
  timestampFormat: TimestampFormat;
  useQueryServerFromCredentialExchange: boolean;
}

export interface CustomFetchClient<
  Req = RequestInfo | URL,
  ReqInit = RequestInit,
  Resp = Response
> {
  (input: Req, init?: ReqInit | undefined): Promise<Resp>;
}

export interface ChalkEnvironmentVariables {
  _CHALK_CLIENT_ID: string;
  _CHALK_CLIENT_SECRET: string;
  _CHALK_API_SERVER: string;
  _CHALK_QUERY_SERVER: string;
  _CHALK_ACTIVE_ENVIRONMENT: string;
  _CHALK_BRANCH: string;
}

/**
 * Module augmentation for process.env that includes our environment variables. We actually
 * don't want these types to leak to end users, since it can be annoying for them to have
 * our internal environment variables popping up in their autocomplete etc
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Partial<ChalkEnvironmentVariables> {}
  }
}

export type ChalkScalarArray = Array<ChalkScalar>;

export interface ChalkScalarObject {
  [key: string]: ChalkScalar;
}

/**
 * Represents a scalar feature value returned by chalk. ChalkScalars
 */
export type ChalkScalar =
  | string
  | number
  | boolean
  | ChalkScalarArray
  | ChalkScalarObject;
