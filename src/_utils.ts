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

interface Debounced<T extends (...args: any) => any> {
  (...args: Parameters<T>): void;

  cancel(): void;
  flush(): void;
}

export function debounce<T extends (...args: any) => any>(func: T, wait: number) {
  let scheduled: number | null = null;
  let lastArgs: unknown[] = [];

  const trigger = () => {
    scheduled = null;
    const callArgs = lastArgs;
    lastArgs = [];
    func(...callArgs);
  }

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (scheduled == null) {
      scheduled = window.setTimeout(trigger, wait);
    }
  }) as Debounced<T>;

  debounced.flush = () => {
    if (scheduled != null) {
      clearTimeout(scheduled);
      trigger();
    }
  }

  debounced.cancel = () => {
    if (scheduled != null) {
      clearTimeout(scheduled);
      scheduled = null;
    }
  }

  return debounced;
}
