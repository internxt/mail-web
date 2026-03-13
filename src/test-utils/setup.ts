// src/test/setup.ts
import { vi } from 'vitest';

vi.mock('@internxt/ui', () => ({
  Loader: () => null,
}));
