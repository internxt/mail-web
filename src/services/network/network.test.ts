import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { decryptSymmetrically } from 'internxt-crypto';
import { NetworkService } from './index';
import { MailService } from '@/services/sdk/mail';
import { MailEncryptionService } from '@/services/mail-encryption';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';
import { AxiosResponseError, AxiosUnknownError } from '@internxt/sdk/dist/shared/types/errors';

vi.mock('@/services/sdk/mail', () => ({
  MailService: { instance: { uploadAttachment: vi.fn(), downloadAttachment: vi.fn() } },
}));

vi.mock('@/services/mail-encryption', () => ({
  MailEncryptionService: {
    instance: {
      encryptAttachment: vi.fn(async (_key: Uint8Array, file: File) => ({
        sessionKey: new Uint8Array(32),
        encryptedFile: new Uint8Array(await file.arrayBuffer()),
      })),
    },
  },
}));

vi.mock('internxt-crypto', () => ({
  decryptSymmetrically: vi.fn(async (_key: Uint8Array, bytes: Uint8Array) => bytes),
}));

const uploadAttachment = vi.mocked(MailService.instance.uploadAttachment);
const downloadAttachment = vi.mocked(MailService.instance.downloadAttachment);
const encryptAttachment = vi.mocked(MailEncryptionService.instance.encryptAttachment);

const aFile = (name = 'a.txt') => new File(['x'], name, { type: 'text/plain' });
const SESSION_KEY = new Uint8Array(32);

const mockSuccess = (result: UploadAttachmentResponse) => ({
  promise: Promise.resolve(result),
  requestCanceler: { cancel: vi.fn() },
});

const mockFailure = (error: unknown) => ({
  promise: Promise.reject(error),
  requestCanceler: { cancel: vi.fn() },
});

describe('Upload', () => {
  beforeEach(() => {
    uploadAttachment.mockReset();
    encryptAttachment.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('When the upload succeeds, then the encrypted file is sent and the result is returned', async () => {
    const result = { blobId: 'blob-1', name: 'a.txt', size: 1, type: 'text/plain' };
    uploadAttachment.mockReturnValue(mockSuccess(result));

    const got = await NetworkService.instance.upload(SESSION_KEY, aFile());

    expect(encryptAttachment).toHaveBeenCalledTimes(1);
    expect(encryptAttachment).toHaveBeenCalledWith(SESSION_KEY, expect.any(File));
    expect(uploadAttachment).toHaveBeenCalledTimes(1);
    expect(got).toEqual(result);
  });

  test('When a canceler is exposed, then the consumer receives it through onCanceler', async () => {
    const cancel = vi.fn();
    uploadAttachment.mockReturnValue({
      promise: Promise.resolve({ blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' }),
      requestCanceler: { cancel },
    });
    const onCanceler = vi.fn();

    await NetworkService.instance.upload(SESSION_KEY, aFile(), { onCanceler });

    expect(onCanceler).toHaveBeenCalledWith({ cancel });
  });

  test('When a transient 5xx error happens, then the upload is retried until success', async () => {
    const serverError = new AxiosResponseError('Internal Server Error', 'POST /upload', { status: 503 } as never);
    const result = { blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' };
    uploadAttachment
      .mockReturnValueOnce(mockFailure(serverError))
      .mockReturnValueOnce(mockFailure(serverError))
      .mockReturnValue(mockSuccess(result));

    const got = await NetworkService.instance.upload(SESSION_KEY, aFile());

    expect(uploadAttachment).toHaveBeenCalledTimes(3);
    expect(got).toEqual(result);
  });

  test('When a transient network error happens, then the upload is retried', async () => {
    const networkError = new AxiosUnknownError('Network error', 'POST /upload', { code: 'ERR_NETWORK' } as never);
    const result = { blobId: 'b', name: 'a.txt', size: 1, type: 'text/plain' };
    uploadAttachment.mockReturnValueOnce(mockFailure(networkError)).mockReturnValue(mockSuccess(result));

    const got = await NetworkService.instance.upload(SESSION_KEY, aFile());

    expect(uploadAttachment).toHaveBeenCalledTimes(2);
    expect(got).toEqual(result);
  });

  test('When a non-transient 4xx error happens, then it is rethrown without retries', async () => {
    const clientError = new AxiosResponseError('Forbidden', 'POST /upload', { status: 403 } as never);
    uploadAttachment.mockReturnValue(mockFailure(clientError));

    await expect(NetworkService.instance.upload(SESSION_KEY, aFile())).rejects.toBe(clientError);
    expect(uploadAttachment).toHaveBeenCalledTimes(1);
  });

  test('When every retry fails transiently, then the last error is rethrown', async () => {
    const serverError = new AxiosResponseError('Internal Server Error', 'POST /upload', { status: 503 } as never);
    uploadAttachment.mockReturnValue(mockFailure(serverError));

    await expect(NetworkService.instance.upload(SESSION_KEY, aFile())).rejects.toBe(serverError);
    expect(uploadAttachment).toHaveBeenCalledTimes(3);
  });

  test('When isCancelled returns true after a failure, then the upload is not retried', async () => {
    const serverError = new AxiosResponseError('Internal Server Error', 'POST /upload', { status: 503 } as never);
    uploadAttachment.mockReturnValue(mockFailure(serverError));
    let cancelled = false;
    const promise = NetworkService.instance.upload(SESSION_KEY, aFile(), {
      isCancelled: () => cancelled,
    });
    cancelled = true;

    await expect(promise).rejects.toBe(serverError);
    expect(uploadAttachment).toHaveBeenCalledTimes(1);
  });
});

describe('Download', () => {
  const decryptSymmetricallyMock = vi.mocked(decryptSymmetrically);

  const downloadInput = {
    mailId: 'mail-1',
    blobId: 'blob-1',
    name: 'photo.jpg',
    type: 'image/jpeg',
    attachmentsSessionKey: new Uint8Array([1, 2, 3, 4]),
  };

  const encryptedBytes = new Uint8Array([9, 9, 9, 9]);
  const plaintextBytes = new Uint8Array([1, 1, 1, 1]);

  beforeEach(() => {
    downloadAttachment.mockReset();
    decryptSymmetricallyMock.mockReset();
  });

  test('When the download succeeds, then the encrypted bytes are decrypted with the session key', async () => {
    downloadAttachment.mockResolvedValue({
      data: encryptedBytes.buffer,
      contentType: 'image/jpeg',
      fileName: 'photo.jpg',
    });
    decryptSymmetricallyMock.mockResolvedValue(plaintextBytes);

    const { blob, name } = await NetworkService.instance.download(downloadInput);

    expect(downloadAttachment).toHaveBeenCalledWith('mail-1', 'blob-1', 'photo.jpg', 'image/jpeg');
    expect(decryptSymmetricallyMock).toHaveBeenCalledWith(downloadInput.attachmentsSessionKey, expect.any(Uint8Array));
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).toBe(plaintextBytes.byteLength);
    expect(name).toBe('photo.jpg');
  });

  test('When the response carries no contentType, then the attachment type is used as a fallback', async () => {
    downloadAttachment.mockResolvedValue({
      data: encryptedBytes.buffer,
      contentType: '',
      fileName: 'photo.jpg',
    });
    decryptSymmetricallyMock.mockResolvedValue(plaintextBytes);

    const { blob } = await NetworkService.instance.download(downloadInput);

    expect(blob.type).toBe('image/jpeg');
  });

  test('When the underlying download fails, then the error is propagated', async () => {
    const error = new Error('download failed');
    downloadAttachment.mockRejectedValue(error);

    await expect(NetworkService.instance.download(downloadInput)).rejects.toBe(error);
    expect(decryptSymmetricallyMock).not.toHaveBeenCalled();
  });

  test('When decryption fails, then the error is propagated', async () => {
    downloadAttachment.mockResolvedValue({
      data: encryptedBytes.buffer,
      contentType: 'image/jpeg',
      fileName: 'photo.jpg',
    });
    const cryptoError = new Error('AEAD tag mismatch');
    decryptSymmetricallyMock.mockRejectedValue(cryptoError);

    await expect(NetworkService.instance.download(downloadInput)).rejects.toBe(cryptoError);
  });
});
