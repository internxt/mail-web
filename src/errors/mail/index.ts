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

export class UpdateMailError extends Error {
  constructor(
    errorMsg?: string,
    action?: 'markAsRead' | 'markAsFlagged' | 'markAsUnflagged' | 'moveToFolder',
    public requestId?: string,
  ) {
    super(`Error while updating mail when ${action}: ` + errorMsg);

    Object.setPrototypeOf(this, UpdateMailError.prototype);
  }
}

export const MAIL_NOT_SETUP_CODE = 'MAIL_NOT_SETUP';

export class MailNotSetupError extends Error {
  constructor(public requestId?: string) {
    super('Mail account has not been set up');

    Object.setPrototypeOf(this, MailNotSetupError.prototype);
  }
}

export class FetchMailAccountKeysError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching mail account keys: ' + errorMsg);

    Object.setPrototypeOf(this, FetchMailAccountKeysError.prototype);
  }
}

export class FetchMailMeError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while fetching mail account status: ' + errorMsg);

    Object.setPrototypeOf(this, FetchMailMeError.prototype);
  }
}

export class DeleteEmailError extends Error {
  constructor(
    errorMsg?: string,
    public requestId?: string,
  ) {
    super('Error while deleting email: ' + errorMsg);

    Object.setPrototypeOf(this, DeleteEmailError.prototype);
  }
}
