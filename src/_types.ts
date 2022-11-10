export interface ChalkClientConfig {
  clientId: string;
  clientSecret: string;
  apiServer: string;
  activeEnvironment: string | undefined;
}

export interface ChalkEnvironmentVariables {
  _CHALK_CLIENT_ID: string;
  _CHALK_CLIENT_SECRET: string;
  _CHALK_API_SERVER: string;
  _CHALK_ACTIVE_ENVIRONMENT: string;
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

export type ChalkScalar = string | number | boolean;
