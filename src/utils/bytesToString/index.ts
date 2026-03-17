import PrettySize from 'prettysize';

export const bytesToString = ({
  size,
  removeSpace = true,
  useSingleChar = false,
  decimals = 1,
  hideSizeString = false,
}: {
  size: number;
  removeSpace?: boolean;
  useSingleChar?: boolean;
  decimals?: number;
  hideSizeString?: boolean;
}): string => {
  if (size >= 0) {
    return PrettySize(size, removeSpace, useSingleChar, decimals, hideSizeString);
  } else {
    return '';
  }
};
