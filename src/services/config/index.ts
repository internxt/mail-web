import { VariableNotFoundError } from './config.errors';

interface ConfigKeys {
  DRIVE_API_URL: string;
  MAIL_API_URL: string;
  PAYMENTS_API_URL: string;
  CRYPTO_SECRET: string;
  MAGIC_IV: string;
  MAGIC_SALT: string;
  DRIVE_APP_URL: string;
}

const configKeys: Record<keyof ConfigKeys, string> = {
  DRIVE_API_URL: 'VITE_DRIVE_API_URL',
  MAIL_API_URL: 'VITE_MAIL_API_URL',
  PAYMENTS_API_URL: 'VITE_PAYMENTS_API_URL',
  CRYPTO_SECRET: 'VITE_CRYPTO_SECRET',
  MAGIC_IV: 'VITE_MAGIC_IV',
  MAGIC_SALT: 'VITE_MAGIC_SALT',
  DRIVE_APP_URL: 'VITE_DRIVE_APP_URL',
};

export class ConfigService {
  public static readonly instance: ConfigService = new ConfigService();

  public getVariable = (key: keyof ConfigKeys): string => {
    const value = import.meta.env[configKeys[key]];
    if (!value) throw new VariableNotFoundError(key);
    return value;
  };

  public isProduction = (): boolean => {
    return import.meta.env.PROD;
  };
}
