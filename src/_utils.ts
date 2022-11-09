export function urlJoin(base: string, path: string) {
  return base.endsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
