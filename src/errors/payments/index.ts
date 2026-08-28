export class FetchUserTierError extends Error {
  constructor(
    message: string,
    public requestId?: string,
  ) {
    super(message);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchUserTierError.prototype);
  }
}
