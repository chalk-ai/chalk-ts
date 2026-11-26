// node-fetch v2 uses non-keep-alive http(s) agents by default, so every
// request would open a new TCP connection. Native fetch (undici, Node 18+)
// already keeps connections alive and needs no agent.
const makeNodeFetch = (): typeof fetch => {
  const nodeFetch = require("node-fetch");
  const http = require("http");
  const https = require("https");
  const httpAgent = new http.Agent({ keepAlive: true });
  const httpsAgent = new https.Agent({ keepAlive: true });
  const agent = (url: { protocol: string }) =>
    url.protocol === "http:" ? httpAgent : httpsAgent;
  return ((url: any, init?: any) =>
    nodeFetch(url, { agent, ...init })) as typeof fetch;
};

export const isoFetch: typeof fetch =
  typeof fetch !== "undefined" ? fetch : makeNodeFetch();

export const isoHeaders: typeof Headers =
  typeof Headers !== "undefined" ? Headers : require("node-fetch").Headers;
