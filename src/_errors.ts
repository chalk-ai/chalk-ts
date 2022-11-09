
export class ChalkError extends Error {
  constructor(opts: {
    message: string,
  }) {
    super(opts.message);
    this.name = ChalkError.name;
  }
}

export function isChalkError(error: any): error is ChalkError {
  return error instanceof ChalkError;
}
