
interface ChalkErrorInfo {
  code: string;
  category: string;
  message: string;

  feature?: string;
  resolver?: string;
}

interface ChalkErrorExtra {
  httpStatus?: number;
  httpStatusText?: string;
  info?: ChalkErrorInfo[];
}

export class ChalkError extends Error {
  public httpStatus: number | undefined;
  public httpStatusText: string | undefined;
  public info: ChalkErrorInfo[];

  constructor(message: string, extra: ChalkErrorExtra) {
    super(message);
    this.name = ChalkError.name;
    this.httpStatus = extra.httpStatus;
    this.httpStatusText = extra.httpStatusText;
    this.info = extra.info ?? [];
  }
}

export function isChalkError(error: any): error is ChalkError {
  return error instanceof ChalkError;
}

export function chalkError(message: string, extra?: ChalkErrorExtra) {
  return new ChalkError(message, extra ?? {});
}
