import { describe, test, expect, vi, beforeEach } from 'vitest';
import { isCurrentPath } from '.';

vi.mock('react-router-dom', () => ({
  matchPath: vi.fn((pattern: string, pathname: string) => {
    if (pattern === pathname) return {};
    if (pathname.startsWith(pattern.replace('/*', ''))) return {};
    return null;
  }),
}));

describe('isCurrentPath', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When the pattern matches the pathname exactly, then it should return true', () => {
    // Arrange
    const pattern = '/inbox';
    const pathname = '/inbox';

    // Act
    const result = isCurrentPath(pattern, pathname);

    // Assert
    expect(result).toBe(true);
  });

  test('When the pattern does not match the pathname, then it should return false', () => {
    // Arrange
    const pattern = '/inbox';
    const pathname = '/sent';

    // Act
    const result = isCurrentPath(pattern, pathname);

    // Assert
    expect(result).toBe(false);
  });

  test('When a wildcard pattern is used and the pathname is a nested route, then it should return true', () => {
    // Arrange
    const pattern = '/inbox/*';
    const pathname = '/inbox/123';

    // Act
    const result = isCurrentPath(pattern, pathname);

    // Assert
    expect(result).toBe(true);
  });

  test('When a wildcard pattern is used and the pathname does not match, then it should return false', () => {
    // Arrange
    const pattern = '/inbox/*';
    const pathname = '/sent/123';

    // Act
    const result = isCurrentPath(pattern, pathname);

    // Assert
    expect(result).toBe(false);
  });
});
