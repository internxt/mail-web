export class MissingAuthParamsToken extends Error {
  constructor() {
    super('Missing auth params token');

    Object.setPrototypeOf(this, MissingAuthParamsToken.prototype);
  }
}

export class AuthCancelledByUserError extends Error {
  constructor() {
    super('Authentication cancelled by user');

    Object.setPrototypeOf(this, AuthCancelledByUserError.prototype);
  }
}

export class AuthTimeoutError extends Error {
  constructor() {
    super('Authentication timed out');

    Object.setPrototypeOf(this, AuthTimeoutError.prototype);
  }
}

export class OpenAuthPopupError extends Error {
  constructor() {
    super(
      'Failed to open authentication popup. Please check your popup blocker settings.',
    );

    Object.setPrototypeOf(this, OpenAuthPopupError.prototype);
  }
}

export class WebAuthProcessingError extends Error {
  constructor(cause?: Error) {
    super(
      `Web authentication processing failed: ${cause instanceof Error ? cause.message : 'Unknown error'}`,
    );

    Object.setPrototypeOf(this, WebAuthProcessingError.prototype);
  }
}
