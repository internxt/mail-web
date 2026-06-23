import { describe, expect, test, vi } from 'vitest';

vi.mock('@/assets/icons/file-types/folder.svg?react', () => ({ default: () => 'folder' }));
vi.mock('@/assets/icons/file-types/default.svg?react', () => ({ default: () => 'default' }));
vi.mock('@/assets/icons/file-types/audio.svg?react', () => ({ default: () => 'audio' }));
vi.mock('@/assets/icons/file-types/code.svg?react', () => ({ default: () => 'code' }));
vi.mock('@/assets/icons/file-types/figma.svg?react', () => ({ default: () => 'figma' }));
vi.mock('@/assets/icons/file-types/image.svg?react', () => ({ default: () => 'image' }));
vi.mock('@/assets/icons/file-types/pdf.svg?react', () => ({ default: () => 'pdf' }));
vi.mock('@/assets/icons/file-types/ppt.svg?react', () => ({ default: () => 'ppt' }));
vi.mock('@/assets/icons/file-types/txt.svg?react', () => ({ default: () => 'txt' }));
vi.mock('@/assets/icons/file-types/video.svg?react', () => ({ default: () => 'video' }));
vi.mock('@/assets/icons/file-types/word.svg?react', () => ({ default: () => 'word' }));
vi.mock('@/assets/icons/file-types/excel.svg?react', () => ({ default: () => 'excel' }));
vi.mock('@/assets/icons/file-types/csv.svg?react', () => ({ default: () => 'csv' }));
vi.mock('@/assets/icons/file-types/zip.svg?react', () => ({ default: () => 'zip' }));

import { getItemIcon } from './icon.service';

describe('icon.service - getItemIcon', () => {
  test('When the item is a folder, then the folder icon is returned regardless of extension', () => {
    const icon = getItemIcon(true, 'pdf') as () => string;

    expect(icon()).toBe('folder');
  });

  test('When the extension matches a known group, then the matching icon is returned', () => {
    const cases: Array<[string, string]> = [
      ['pdf', 'pdf'],
      ['jpg', 'image'],
      ['mp3', 'audio'],
      ['txt', 'txt'],
      ['mp4', 'video'],
      ['docx', 'word'],
      ['xlsx', 'excel'],
      ['zip', 'zip'],
      ['fig', 'figma'],
    ];

    for (const [extension, expectedIcon] of cases) {
      const icon = getItemIcon(false, extension) as () => string;
      expect(icon(), `extension "${extension}" should map to "${expectedIcon}"`).toBe(expectedIcon);
    }
  });

  test('When the extension is uppercase, then it is matched case-insensitively', () => {
    const icon = getItemIcon(false, 'PDF') as () => string;

    expect(icon()).toBe('pdf');
  });

  test('When the extension is unknown, then the default icon is returned', () => {
    const icon = getItemIcon(false, 'unknown-ext-xyz') as () => string;

    expect(icon()).toBe('default');
  });

  test('When no extension is provided, then the default icon is returned', () => {
    const icon = getItemIcon(false) as () => string;

    expect(icon()).toBe('default');
  });
});
