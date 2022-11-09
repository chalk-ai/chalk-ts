export function urlJoin(base: string, path: string) {
  return base.endsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function fromEntries<V>(entries: [string, V][]): Record<string, V> {
  if (typeof Object.fromEntries !== "undefined") {
    return Object.fromEntries(entries);
  } else {
    let result: any = {};
    for (const [key, value] of entries) {
      result[key] = value;
    }

    return result;
  }
}
