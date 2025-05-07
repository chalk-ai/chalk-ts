import { ChalkHttpHeaders } from "./_header";

export interface ChalkRequestOptions {
  /**
   * If specified, Chalk will route this request to the relevant branch. Overrides the branch passed in to the
   * client initialization.
   */
  branch?: string;
  /**
   * The timeout for the request in milliseconds. If not provided, the client will use the default timeout
   * specified at the client level.
   */
  timeout?: number;
  /**
   * Additional headers to include in this request. These headers will be merged with the headers provided at the client level.
   */
  additionalHeaders?: ChalkHttpHeaders;
}
