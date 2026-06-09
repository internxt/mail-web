import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UploadManager, type UploadManagerCallbacks } from './index';
import { NetworkService } from '@/services/network';

vi.mock('@/services/network', () => ({
  NetworkService: { instance: { upload: vi.fn() } },
}));

const upload = vi.mocked(NetworkService.instance.upload);

const aFile = (name = 'a.txt') => new File(['x'], name, { type: 'text/plain' });
const SESSION_KEY = new Uint8Array(32);

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

const newManager = (callbacks: Partial<UploadManagerCallbacks> = {}) =>
  new UploadManager(SESSION_KEY, {
    onSuccess: vi.fn(),
    onError: vi.fn(),
    ...callbacks,
  });

describe('Upload Manager', () => {
  beforeEach(() => {
    upload.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enqueue', () => {
    test('When the upload resolves, then onSuccess is called with the resulting blobId', async () => {
      upload.mockResolvedValue({ blobId: 'blob-1', name: 'a.txt', size: 1, type: 'text/plain' });
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('id-0', aFile());
      await flush();

      expect(onSuccess).toHaveBeenCalledWith('id-0', 'blob-1');
      expect(onError).not.toHaveBeenCalled();
    });

    test('When the upload rejects, then onError is called with the error', async () => {
      const error = new Error('boom');
      upload.mockRejectedValue(error);
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('id-0', aFile());
      await flush();

      expect(onError).toHaveBeenCalledWith('id-0', error);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    test('When multiple files are enqueued, then the queue caps in-flight uploads at the configured concurrency', async () => {
      const releases: Array<() => void> = [];
      upload.mockImplementation(
        () =>
          new Promise((resolve) => {
            releases.push(() => resolve({ blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' }));
          }),
      );
      const manager = newManager();

      for (let i = 0; i < 6; i++) manager.enqueue(`id-${i}`, aFile(`${i}.txt`));
      await flush();

      expect(upload).toHaveBeenCalledTimes(4);

      releases[0]();
      releases[1]();
      await flush();
      expect(upload).toHaveBeenCalledTimes(6);
    });

    test('When the file is forwarded to NetworkService, then the session key is passed through', async () => {
      upload.mockResolvedValue({ blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' });
      const file = aFile();
      const manager = newManager();

      manager.enqueue('id-0', file);
      await flush();

      expect(upload).toHaveBeenCalledWith(SESSION_KEY, file, expect.any(Object));
    });
  });

  describe('retry', () => {
    test('When retry is called with an unknown id, then nothing happens', async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.retry('does-not-exist');
      await flush();

      expect(upload).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    test('When retry is called after a failed upload, then the caller is notified of the eventual success', async () => {
      upload.mockRejectedValueOnce(new Error('initial failure'));
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('id-0', aFile());
      await flush();
      expect(onError).toHaveBeenCalledWith('id-0', expect.any(Error));

      upload.mockResolvedValueOnce({ blobId: 'retry-blob', name: 'a.txt', size: 1, type: 'text/plain' });
      onSuccess.mockReset();
      onError.mockReset();

      manager.retry('id-0');
      await flush();

      expect(onSuccess).toHaveBeenCalledWith('id-0', 'retry-blob');
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    test('When cancel is called before the upload starts, then its callbacks are never invoked', async () => {
      const releasers: Record<string, () => void> = {};
      upload.mockImplementation(
        (_key, file) =>
          new Promise((resolve) => {
            releasers[file.name] = () => resolve({ blobId: file.name, name: file.name, size: 1, type: 'text/plain' });
          }),
      );

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('first', aFile('1.txt'));
      manager.enqueue('second', aFile('2.txt'));
      await flush();

      manager.cancel('second');
      releasers['1.txt']?.();
      releasers['2.txt']?.();
      await flush();

      const calls = [...onSuccess.mock.calls, ...onError.mock.calls];
      expect(calls.some(([id]) => id === 'second')).toBe(false);
      expect(onSuccess).toHaveBeenCalledWith('first', '1.txt');
    });

    test('When cancel is called while the upload is in flight, then the in-flight canceler is triggered', async () => {
      const cancelSpy = vi.fn();
      let rejectFirst: ((reason: unknown) => void) | undefined;
      upload.mockImplementationOnce((_key, _file, options) => {
        options?.onCanceler?.({ cancel: cancelSpy });
        return new Promise((_resolve, reject) => {
          rejectFirst = reject;
        });
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('id-0', aFile());
      await flush();
      manager.cancel('id-0');
      rejectFirst?.(new Error('aborted'));
      await flush();

      expect(cancelSpy).toHaveBeenCalledWith('Upload cancelled');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    test('When clear is called, then every in-flight job is cancelled and no callbacks fire afterwards', async () => {
      const cancelSpies: Array<ReturnType<typeof vi.fn>> = [];
      upload.mockImplementation((_key, _file, options) => {
        const cancel = vi.fn();
        cancelSpies.push(cancel);
        options?.onCanceler?.({ cancel });
        return new Promise(() => {});
      });
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const manager = newManager({ onSuccess, onError });

      manager.enqueue('id-0', aFile('1.txt'));
      manager.enqueue('id-1', aFile('2.txt'));
      await flush();

      manager.clear();
      await flush();

      cancelSpies.forEach((cancel) => expect(cancel).toHaveBeenCalledWith('Upload cancelled'));
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
