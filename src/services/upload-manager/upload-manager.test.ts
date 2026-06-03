import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UploadManager } from './index';
import { MailService } from '@/services/sdk/mail';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { uploadAttachment: vi.fn() } },
}));

const uploadAttachment = vi.mocked(MailService.instance.uploadAttachment);

const aFile = (name = 'a.txt') => new File(['x'], name, { type: 'text/plain' });

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const mockSuccess = (result: UploadAttachmentResponse) => ({
  promise: Promise.resolve(result),
  requestCanceler: { cancel: vi.fn() },
});

const mockFailure = (error: unknown) => ({
  promise: Promise.reject(error),
  requestCanceler: { cancel: vi.fn() },
});

describe('Upload Manager', () => {
  beforeEach(() => {
    uploadAttachment.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('run', () => {
    test('When files are pushed, then it returns a handle per file with stable id and File', () => {
      uploadAttachment.mockReturnValue(mockSuccess({ blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' }));
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
      uploadAttachment.mockReturnValue(mockSuccess(result));
      const onSuccess = vi.fn();
      const onError = vi.fn();

      const [{ id }] = UploadManager.instance.run([aFile()], { onSuccess, onError });
      await flush();

      expect(onSuccess).toHaveBeenCalledWith(id, result);
      expect(onError).not.toHaveBeenCalled();
    });

    test('When upload fails on all attempts, then error is handled properly', async () => {
      const error = new Error('boom');
      uploadAttachment.mockReturnValue(mockFailure(error));
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
        .mockReturnValueOnce(mockFailure(new Error('1')))
        .mockReturnValueOnce(mockFailure(new Error('2')))
        .mockReturnValue(mockSuccess(result));
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

    test('When retry is called after a failed upload, then a new attempt succeeds and notifies onSuccess', async () => {
      uploadAttachment.mockReturnValue(mockFailure(new Error('initial failure')));
      const initialError = vi.fn();
      const [{ id }] = UploadManager.instance.run([aFile()], { onSuccess: vi.fn(), onError: initialError });
      await flush();
      expect(initialError).toHaveBeenCalledWith(id, expect.any(Error));

      const result = { blobId: 'retry-blob', name: 'a.txt', size: 1, type: 'text/plain' };
      uploadAttachment.mockReturnValue(mockSuccess(result));
      const onSuccess = vi.fn();
      const onError = vi.fn();

      UploadManager.instance.retry(id, { onSuccess, onError });
      await flush();

      expect(onSuccess).toHaveBeenCalledWith(id, result);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    test('When remove is called before the upload starts, then callbacks are never invoked', async () => {
      let resolveBlocker: (() => void) | undefined;
      const blocker = new Promise<UploadAttachmentResponse>((res) => {
        resolveBlocker = () => res({ blobId: 'first', name: 'a.txt', size: 1, type: 'text/plain' });
      });
      uploadAttachment.mockReturnValueOnce({ promise: blocker, requestCanceler: { cancel: vi.fn() } });
      uploadAttachment.mockReturnValue(mockSuccess({ blobId: 'never', name: 'b', size: 1, type: 'text/plain' }));

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

    test('When remove is called while the upload is in flight, then the canceler is invoked', async () => {
      const cancel = vi.fn();
      let resolveBlocker: (() => void) | undefined;
      const blocker = new Promise<UploadAttachmentResponse>((_res, rej) => {
        resolveBlocker = () => rej(new Error('aborted'));
      });
      uploadAttachment.mockReturnValueOnce({ promise: blocker, requestCanceler: { cancel } });

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const [{ id }] = UploadManager.instance.run([aFile()], { onSuccess, onError });
      await flush();

      UploadManager.instance.remove(id);
      resolveBlocker?.();
      await flush();

      expect(cancel).toHaveBeenCalledWith('Upload cancelled');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
