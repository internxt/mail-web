import prettyBytes from 'pretty-bytes';

export const bytesToString = (bytes: number, options?: { space?: boolean; nonBreakingSpace?: boolean }) => {
  return prettyBytes(bytes, {
    space: options?.space,
    nonBreakingSpace: options?.nonBreakingSpace,
  });
};
