import { ChalkErrorData } from "./_interface";

interface ChalkErrorExtra {
  httpStatus?: number;
  httpStatusText?: string;
  info?: ChalkErrorData[];
}

export class ChalkError extends Error {
  public httpStatus: number | undefined;
  public httpStatusText: string | undefined;
  public info: ChalkErrorData[];

  constructor(message: string, extra: ChalkErrorExtra = {}) {
    super(message);
    this.name = ChalkError.name;
    this.httpStatus = extra.httpStatus;
    this.httpStatusText = extra.httpStatusText;
    this.info = extra.info ?? [];
  }
}

export function isChalkError(error: unknown): error is ChalkError {
  return error instanceof ChalkError;
}
