import type { ConfigKeys } from '@/types/config';

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');

    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class EnvVariableNotFoundError extends Error {
  constructor(variableName: keyof ConfigKeys) {
    super(`Variable not found: ${variableName}`);
    this.name = 'EnvVariableNotFoundError';

    Object.setPrototypeOf(this, EnvVariableNotFoundError.prototype);
  }
}
