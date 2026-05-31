export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type AnyObj = Record<string, unknown>;

function isObject(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Merge `override` onto `base`, returning a new object. Missing keys keep `base`'s value. */
export function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  if (!isObject(base) || !isObject(override)) {
    return (override as T) ?? base;
  }
  const out: AnyObj = { ...(base as AnyObj) };
  for (const key of Object.keys(override as AnyObj)) {
    const b = (base as AnyObj)[key];
    const o = (override as AnyObj)[key];
    if (o === undefined) continue;
    out[key] = isObject(b) && isObject(o) ? deepMerge(b, o as DeepPartial<typeof b>) : o;
  }
  return out as T;
}
