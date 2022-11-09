interface ChalkErrorExtra {
  httpStatus?: number;
  httpStatusText?: string;
}

export class ChalkError extends Error {
  public httpStatus?: number;
  public httpStatusText?: string;

  constructor(message: string, extra?: ChalkErrorExtra) {
    super(message);
    this.name = ChalkError.name;
    this.httpStatus = extra?.httpStatus;
    this.httpStatusText = extra?.httpStatusText;
  }
}

export function isChalkError(error: any): error is ChalkError {
  return error instanceof ChalkError;
}

export function chalkError(message: string, extra?: ChalkErrorExtra) {
  return new ChalkError(message, extra);
}
