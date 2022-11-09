
export class ChalkError extends Error {
  private httpStatus?: number;
  private httpStatusText?: string;

  constructor(message: string, extra?: {
    httpStatus?: number;
    httpStatusText?: string;
  }) {
    super(message);
    this.name = ChalkError.name;
    this.httpStatus = extra?.httpStatus;
    this.httpStatusText = extra?.httpStatusText;
  }
}

export function isChalkError(error: any): error is ChalkError {
  return error instanceof ChalkError;
}
