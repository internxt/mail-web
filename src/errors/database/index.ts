export class MnemonicNotFoundError extends Error {
  constructor() {
    super('Mnemonic not found');
    this.name = 'MnemonicNotFoundError';
    Object.setPrototypeOf(this, MnemonicNotFoundError.prototype);
  }
}

export class ProviderNotInitializedError extends Error {
  constructor() {
    super('Provider not initialized');
    this.name = 'ProviderNotInitializedError';
    Object.setPrototypeOf(this, ProviderNotInitializedError.prototype);
  }
}

export class EmailNotFoundError extends Error {
  constructor(emailId: string) {
    super(`Email ${emailId} not found`);
    this.name = 'EmailNotFoundError';
    Object.setPrototypeOf(this, EmailNotFoundError.prototype);
  }
}
