import { describe, test, expect, vi, beforeEach } from 'vitest';
import { batchProcess } from '.';

describe('Batch Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  test('When there are no items, then the handler is never called', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    await batchProcess([], handler);

    expect(handler).not.toHaveBeenCalled();
  });

  test('When items fit in a single batch, then the handler is called once per item', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const items = [1, 2, 3];

    await batchProcess(items, handler);

    expect(handler).toHaveBeenCalledTimes(3);
  });

  test('When items exceed the batch size, then they are processed in multiple batches', async () => {
    const order: number[] = [];
    const handler = vi.fn((item: number) => {
      order.push(item);
      return Promise.resolve();
    });
    const items = Array.from({ length: 25 }, (_, i) => i);

    await batchProcess(items, handler, 10);

    expect(handler).toHaveBeenCalledTimes(25);
    expect(order).toEqual(items);
  });

  test('When a custom batch size is provided, then it is respected', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const items = Array.from({ length: 9 }, (_, i) => i);
    const batchSize = 3;

    await batchProcess(items, handler, batchSize);

    const expectedBatches = Math.ceil(items.length / batchSize);
    for (let i = 0; i < expectedBatches; i++) {
      const batchCalls = handler.mock.calls.slice(i * batchSize, (i + 1) * batchSize).map(([item]) => item);
      expect(batchCalls).toEqual(items.slice(i * batchSize, (i + 1) * batchSize));
    }
    expect(handler).toHaveBeenCalledTimes(items.length);
  });

  test('When one batch completes, then the next batch starts after it', async () => {
    const callLog: string[] = [];
    let resolveFirst!: () => void;

    const handler = vi.fn((item: number) => {
      if (item === 0) {
        return new Promise<void>((res) => {
          resolveFirst = () => {
            callLog.push('batch-1-done');
            res();
          };
        });
      }
      callLog.push(`item-${item}`);
      return Promise.resolve();
    });

    const items = [0, 10];
    const promise = batchProcess(items, handler, 1);

    expect(callLog).not.toContain('item-10');
    resolveFirst();
    await promise;

    expect(callLog.indexOf('batch-1-done')).toBeLessThan(callLog.indexOf('item-10'));
  });

  test('When a handler throws, then the error propagates', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('handler error'));

    await expect(batchProcess([1], handler)).rejects.toThrow('handler error');
  });
});
