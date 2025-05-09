import { ChalkPrimitiveType } from "./_interface/_types";

export const DEFAULT_API_SERVER = "https://api.chalk.ai";

export const CHALK_DATE_TYPES: Set<ChalkPrimitiveType | undefined | null> =
  new Set([`<class 'datetime.date'>`, `<class 'datetime.datetime'>`]);
