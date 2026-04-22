export class FetchMailboxesInfoError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching mailboxes info: ' + errorMsg);

    Object.setPrototypeOf(this, FetchMailboxesInfoError.prototype);
  }
}

export class FetchListFolderError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching list folder: ' + errorMsg);

    Object.setPrototypeOf(this, FetchListFolderError.prototype);
  }
}

export class FetchMessageError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching message: ' + errorMsg);

    Object.setPrototypeOf(this, FetchMessageError.prototype);
  }
}

export class SearchMailError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while searching emails: ' + errorMsg);

    Object.setPrototypeOf(this, SearchMailError.prototype);
  }
}

export class UpdateMailError extends Error {
  constructor(
    errorMsg?: string,
    action?: 'markAsRead' | 'markAsFlagged' | 'markAsUnflagged',
    public requestId?: string,
  ) {
    super(`Error while updating mail when ${action}: ` + errorMsg);

    Object.setPrototypeOf(this, UpdateMailError.prototype);
  }
}
