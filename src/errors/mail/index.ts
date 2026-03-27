export class FetchMailboxesInfoError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching mailboxes info: ' + errorMsg);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchMailboxesInfoError.prototype);
  }
}

export class FetchListFolderError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching list folder: ' + errorMsg);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchListFolderError.prototype);
  }
}

export class FetchMessageError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching message: ' + errorMsg);
    this.requestId = requestId;

    Object.setPrototypeOf(this, FetchMessageError.prototype);
  }
}

export class UpdateMailError extends Error {
  constructor(
    errorMsg?: string,
    action?: 'markAsRead' | 'markAsFlagged' | 'markAsUnflagged',
    public requestId?: string,
  ) {
    super(`Error while updating mail when ${action}: ` + errorMsg);
    this.requestId = requestId;

    Object.setPrototypeOf(this, UpdateMailError.prototype);
  }
}
