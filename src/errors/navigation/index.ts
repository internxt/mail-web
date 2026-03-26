export class NavigationNotInitializedError extends Error {
  constructor() {
    super('Navigation is not initialized');

    Object.setPrototypeOf(this, NavigationNotInitializedError.prototype);
  }
}
