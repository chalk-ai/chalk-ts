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
  private credentialsExpiresAt: number | null = null;

  constructor(
    private config: ChalkClientConfig,
    private http: ChalkHTTPService
  ) {}

  async get(): Promise<ClientCredentials> {
    // Check if credentials exist and are still valid
    if (this.credentials != null && this.credentialsExpiresAt != null) {
      // Refresh proactively if within 60 seconds of expiry
      const now = Date.now();
      const refreshThreshold = 60 * 1000; // 60 seconds
      if (now < this.credentialsExpiresAt - refreshThreshold) {
        return this.credentials;
      }
      // Clear expired or soon-to-expire credentials
      this.clear();
    }

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
        
        // Calculate expiration time
        if (this.credentials.expires_in) {
          // expires_in is in seconds, convert to milliseconds
          this.credentialsExpiresAt = Date.now() + (this.credentials.expires_in * 1000);
        }
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
    this.credentialsExpiresAt = null;
  }

  async getPrimaryEnvironmentFromCredentials(): Promise<
    string | null | undefined
  > {
    const { primary_environment: environmentIdFromCredentials } =
      await this.get();

    return environmentIdFromCredentials;
  }

  async getEngineUrlFromCredentials(
    environmentId: string | null | undefined
  ): Promise<string | null> {
    const { engines } = await this.get();
    const engineForEnvironment = environmentId
      ? engines?.[environmentId]
      : null;

    return engineForEnvironment || null;
  }
}
