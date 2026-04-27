import { describe, test, expect, vi, beforeEach } from 'vitest';
import { batchProcess } from '.';

describe('Batch Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const batches: number[][] = [];
    let current: number[] = [];

    const handler = vi.fn(async (item: number) => {
      current.push(item);
    });

    const items = Array.from({ length: 9 }, (_, i) => i);

    const originalPromiseAll = Promise.all.bind(Promise);
    const spy = vi.spyOn(Promise, 'all').mockImplementation((promises) => {
      batches.push([...current]);
      current = [];
      return originalPromiseAll(promises);
    });

    await batchProcess(items, handler, 3);

    spy.mockRestore();
    expect(batches).toHaveLength(3);
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

    resolveFirst();
    await promise;

    expect(callLog.indexOf('batch-1-done')).toBeLessThan(callLog.indexOf('item-10'));
  });

  test('When a handler throws, then the error propagates', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('handler error'));

    await expect(batchProcess([1], handler)).rejects.toThrow('handler error');
  });
});
