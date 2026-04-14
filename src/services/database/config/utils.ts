import type { EmailParams } from '../types';

export function generateEmailParamPath<K extends keyof EmailParams>(key: K): `params.${K}` {
  return `params.${key}`;
}
