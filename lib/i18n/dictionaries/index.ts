import { deepMerge } from "../deepMerge";
import { en, type Dictionary } from "./en";
import { hi } from "./hi";
import { bn } from "./bn";
import { mr } from "./mr";
import { te } from "./te";

/** Each locale merged onto English so every key always resolves. */
const overrides = { hi, bn, mr, te } as const;

const cache: Record<string, Dictionary> = { en };

export function getDictionary(locale: string): Dictionary {
  if (cache[locale]) return cache[locale];
  const override = overrides[locale as keyof typeof overrides];
  const dict = override ? deepMerge(en, override) : en;
  cache[locale] = dict;
  return dict;
}

export type { Dictionary };
