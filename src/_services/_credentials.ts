import { ChalkClientConfig } from "../_interface";
import { ChalkError, isChalkError } from "../_errors";
import { ChalkHTTPService } from "./_http";

export interface ClientCredentials {
  access_token: string;
  token_type: string;
  primary_environment?: string | null;
  expires_in: number;
  engines?: {
    [name: string]: string;
  };
}

export class CredentialsHolder {
  private credentials: ClientCredentials | null = null;

  constructor(
    private config: ChalkClientConfig,
    private http: ChalkHTTPService
  ) {}

  async get() {
    if (this.credentials == null) {
      try {
        this.credentials = await this.http.v1_oauth_token({
          baseUrl: this.config.apiServer,
          body: {
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            grant_type: "client_credentials",
          },
        });
      } catch (e) {
        console.error(e);
        if (isChalkError(e)) {
          throw e;
        } else if (e instanceof Error) {
          throw new ChalkError(e.message);
        } else {
          throw new ChalkError(
            "Unable to authenticate to Chalk servers. Please check your environment config"
          );
        }
      }
    }

    return this.credentials;
  }

  clear() {
    this.credentials = null;
  }

  async getEngineUrlFromCredentials(
    environmentId: string | null | undefined
  ): Promise<string | null> {
    const { engines, primary_environment: environmentIdFromCredentials } =
      await this.get();
    const envIdToUse = environmentId || environmentIdFromCredentials;
    const engineForEnvironment = envIdToUse ? engines?.[envIdToUse] : null;

    return engineForEnvironment || null;
  }
}
