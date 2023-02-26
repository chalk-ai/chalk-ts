export function urlJoin(base: string, path: string) {
  while (base.endsWith("/")) {
    base = base.substring(0, base.length - 1);
  }

  while (path.startsWith("/")) {
    path = path.substring(1);
  }

  return `${base}/${path}`;
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
