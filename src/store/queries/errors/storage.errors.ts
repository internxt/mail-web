export class FetchStorageUsageError extends Error {
  constructor(
    message: string,
    public requestId?: string,
  ) {
    super(message);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchStorageUsageError.prototype);
  }
}

export class FetchStorageLimitError extends Error {
  constructor(
    message: string,
    public requestId?: string,
  ) {
    super(message);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchStorageLimitError.prototype);
  }
}
