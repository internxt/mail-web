import { describe, expect, test } from 'vitest';
import fileExtensionService from './file-extension.service';
import { FileExtensionGroup } from './types';

describe('file-extension.service - computeExtensionsLists', () => {
  test('When no filter is provided, then every extension group is populated', () => {
    const result = fileExtensionService.computeExtensionsLists();

    expect(result[FileExtensionGroup.Pdf]).toContain('pdf');
    expect(result[FileExtensionGroup.Image]).toContain('jpg');
    expect(result[FileExtensionGroup.Audio]).toContain('mp3');
    expect(result[FileExtensionGroup.Default]).toBeDefined();
  });

  test('When a group key has multiple extensions, then all of them are included in the flattened list', () => {
    const result = fileExtensionService.computeExtensionsLists();

    expect(result[FileExtensionGroup.Image]).toEqual(expect.arrayContaining(['jpg', 'jpeg']));
  });

  test('When a filter narrows a group, then only the selected format keys are included', () => {
    const result = fileExtensionService.computeExtensionsLists({
      [FileExtensionGroup.Image]: ['jpg'],
    });

    expect(result[FileExtensionGroup.Image]).toEqual(expect.arrayContaining(['jpg', 'jpeg']));
    expect(result[FileExtensionGroup.Image]).not.toContain('png');
  });

  test('When a filter is applied to one group, then the other groups are unaffected', () => {
    const result = fileExtensionService.computeExtensionsLists({
      [FileExtensionGroup.Image]: ['jpg'],
    });

    expect(result[FileExtensionGroup.Pdf]).toContain('pdf');
    expect(result[FileExtensionGroup.Audio]).toContain('mp3');
  });
});
