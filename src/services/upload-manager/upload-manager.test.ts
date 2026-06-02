import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UploadManager } from './index';
import { MailService } from '@/services/sdk/mail';

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { uploadAttachment: vi.fn() } },
}));

const uploadAttachment = vi.mocked(MailService.instance.uploadAttachment);

const aFile = (name = 'a.txt') => new File(['x'], name, { type: 'text/plain' });

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

describe('Upload Manager', () => {
  beforeEach(() => {
    uploadAttachment.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('run', () => {
    test('When files are pushed, then it returns a handle per file with stable id and File', () => {
      uploadAttachment.mockResolvedValue({ blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' });
      const f1 = aFile('1.txt');
      const f2 = aFile('2.txt');

      const handles = UploadManager.instance.run([f1, f2], { onSuccess: vi.fn(), onError: vi.fn() });

      expect(handles).toHaveLength(2);
      expect(handles[0].file).toBe(f1);
      expect(handles[1].file).toBe(f2);
      expect(handles[0].id).not.toBe(handles[1].id);
    });

    test('When upload succeeds, then the upload success is handled correctly', async () => {
      const result = { blobId: 'blob-1', name: 'a.txt', size: 1, type: 'text/plain' };
      uploadAttachment.mockResolvedValue(result);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const [{ id }] = UploadManager.instance.run([aFile()], { onSuccess, onError });
      await flush();

      expect(onSuccess).toHaveBeenCalledWith(id, result);
      expect(onError).not.toHaveBeenCalled();
    });

    test('When upload fails on all attempts, then error is handled properly', async () => {
      const error = new Error('boom');
      uploadAttachment.mockRejectedValue(error);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const [{ id }] = UploadManager.instance.run([aFile()], { onSuccess, onError });
      await flush();

      expect(onError).toHaveBeenCalledWith(id, error);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('When upload fails transiently, then it retries until success (max 3 attempts)', async () => {
      const result = { blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' };
      uploadAttachment
        .mockRejectedValueOnce(new Error('1'))
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValue(result);
      const onSuccess = vi.fn();
      const onError = vi.fn();

      UploadManager.instance.run([aFile()], { onSuccess, onError });
      await flush();

      expect(uploadAttachment).toHaveBeenCalledTimes(3);
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('retry', () => {
    test('When retry is called with an unknown id, then nothing happens', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      UploadManager.instance.retry('does-not-exist', { onSuccess, onError });
      await flush();

      expect(uploadAttachment).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    test('When remove is called before the upload starts, then callbacks are never invoked', async () => {
      let resolveBlocker: (() => void) | undefined;
      const blocker = new Promise<void>((res) => {
        resolveBlocker = res;
      });
      uploadAttachment.mockImplementationOnce(async () => {
        await blocker;
        return { blobId: 'first', name: 'a.txt', size: 1, type: 'text/plain' };
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const [first, second] = UploadManager.instance.run([aFile('1.txt'), aFile('2.txt')], { onSuccess, onError });

      UploadManager.instance.remove(second.id);
      resolveBlocker?.();
      await flush();

      const calls = [...onSuccess.mock.calls, ...onError.mock.calls];
      expect(calls.some(([id]) => id === second.id)).toBe(false);
      expect(onSuccess).toHaveBeenCalledWith(first.id, expect.any(Object));
    });
  });
});
