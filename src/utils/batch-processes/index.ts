const DEFAULT_BATCH_SIZE = 10;

export const batchProcess = async <T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(batch.map(handler));
  }
};
