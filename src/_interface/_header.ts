/**
 * An interface recording available headers that can be sent to the chalk engine to change its behavior.
 * */
export interface ChalkHttpHeadersStrict {
  "X-Chalk-Env-Id"?: string;
  "X-Chalk-Branch-Id"?: string;
  /**
   * If specified, changes which type of engine deployment to target.
   * The typescript client does not yet communicate with grpc engines, use carefully!
   */
  "X-Chalk-Deployment-Type"?: "engine" | "engine-grpc";
  /**
   * If true, assumes explicit versioning of the versions and ignores default.
   * This also means that the output data shape always matches the query requested output.
   *
   * ex. class.versioned_feature with a default v2 will return the v1 resolver data under the
   * field "class.versioned_feature", instead of v2 resolver data on the field "class.versioned_feature@v2"
   * */
  "X-Chalk-Features-Versioned"?: boolean;
  /**
   * Specifies which resource group should be targeted for executing the query.
   */
  "X-Chalk-Resource-Group"?: string;
  "User-Agent"?: string;
}

type ChalkHttpHeadersKeys = keyof ChalkHttpHeadersStrict;
interface ChalkHttpHeadersFreeform {
  [key: Exclude<string, ChalkHttpHeadersKeys>]: string | number | boolean;
}

export type ChalkHttpHeaders = ChalkHttpHeadersFreeform &
  ChalkHttpHeadersStrict;
