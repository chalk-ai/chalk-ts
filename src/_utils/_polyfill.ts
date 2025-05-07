export const isoFetch: typeof fetch =
  typeof fetch !== "undefined" ? fetch : require("node-fetch");

export const isoHeaders: typeof Headers =
  typeof Headers !== "undefined" ? Headers : require("node-fetch").Headers;
