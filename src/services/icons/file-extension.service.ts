import fileExtensionGroups, { FileExtensionGroup } from './types';

type FileExtensionGroupKey = keyof typeof FileExtensionGroup;

function computeExtensionsLists(
  filter: { [key in FileExtensionGroup]?: string[] } = {},
): Record<FileExtensionGroup, string[]> {
  const extensionsLists: Partial<Record<FileExtensionGroup, string[]>> = {};

  (Object.keys(FileExtensionGroup) as FileExtensionGroupKey[])
    .filter((groupId) => Number.isNaN(Number(groupId)))
    .forEach((groupId) => {
      const groupValue = FileExtensionGroup[groupId];
      extensionsLists[groupValue] = computeExtensionsList(groupValue, filter[groupValue]);
    });

  return extensionsLists as Record<FileExtensionGroup, string[]>;
}
function computeExtensionsList(groupId: FileExtensionGroup, filter?: string[]): string[] {
  return Object.entries(fileExtensionGroups[groupId])
    .filter(([formatKey]) => !filter || filter.includes(formatKey))
    .reduce((t, [, formatExtensions]): string[] => {
      return t.concat(formatExtensions);
    }, [] as string[]);
}

const fileExtensionService = {
  computeExtensionsLists,
};

export default fileExtensionService;
