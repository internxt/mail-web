export class VariableNotFoundError extends Error {
  constructor(variableName: string) {
    super(`Variable not found: ${variableName}`);

    Object.setPrototypeOf(this, VariableNotFoundError.prototype);
  }
}
