const BATCH_PROCESSES = 10;

export const batchProcess = async <T>(
  items: T[],
  handler: (item: T) => Promise<void>,
  batchSize = BATCH_PROCESSES,
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(batch.map(handler));
  }
};
