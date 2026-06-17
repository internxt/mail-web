import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import useAttachments from './useAttachments';
import notificationsService, { ToastType } from '@/services/notifications';
import { MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL } from '@/constants';
import type { UploadManagerCallbacks } from '@/services/upload-manager';
import type { InheritedAttachmentInput } from './useAttachments';

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@/services/notifications', () => ({
  default: { show: vi.fn() },
  ToastType: { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info', Loading: 'loading' },
}));

vi.mock('internxt-crypto', () => ({ genSymmetricKey: () => new Uint8Array(32) }));

const enqueue = vi.fn();
const retryFn = vi.fn();
const cancel = vi.fn();
const clear = vi.fn();
let lastCallbacks: UploadManagerCallbacks | undefined;

vi.mock('@/services/upload-manager', () => ({
  UploadManager: class {
    constructor(_sessionKey: Uint8Array, callbacks: UploadManagerCallbacks) {
      lastCallbacks = callbacks;
    }
    enqueue = enqueue;
    retry = retryFn;
    cancel = cancel;
    clear = clear;
  },
}));

const show = vi.mocked(notificationsService.show);

let idSeq = 0;
const fileOfSize = (size: number, name = 'a.txt', type = 'text/plain'): File => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

beforeEach(() => {
  idSeq = 0;
  vi.stubGlobal('crypto', { ...globalThis.crypto, randomUUID: () => `id-${idSeq++}` });
  enqueue.mockReset();
  retryFn.mockReset();
  cancel.mockReset();
  clear.mockReset();
  show.mockReset();
  lastCallbacks = undefined;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Attachments - custom hook', () => {
  describe('Adding files', () => {
    test('When files are added, then files are handled as expected', () => {
      const f1 = fileOfSize(100, '1.txt');
      const f2 = fileOfSize(200, '2.bin', 'application/octet-stream');
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));

      act(() => result.current.addFiles([f1, f2]));

      expect(enqueue).toHaveBeenNthCalledWith(1, 'id-0', f1);
      expect(enqueue).toHaveBeenNthCalledWith(2, 'id-1', f2);
      expect(result.current.attachments).toEqual([
        { kind: 'uploaded', id: 'id-0', name: '1.txt', size: 100, type: 'text/plain', status: 'uploading', file: f1 },
        {
          kind: 'uploaded',
          id: 'id-1',
          name: '2.bin',
          size: 200,
          type: 'application/octet-stream',
          status: 'uploading',
          file: f2,
        },
      ]);
      expect(result.current.totalSize).toBe(f1.size + f2.size);
      expect(result.current.isUploading).toBe(true);
      expect(result.current.hasErrors).toBe(false);

      act(() => {
        lastCallbacks?.onSuccess('id-0', 'blob-0');
        lastCallbacks?.onSuccess('id-1', 'blob-1');
      });

      expect(result.current.totalSize).toBe(300);
    });

    test('When the new batch would exceed the limit, then it shows a warning toast and does not enqueue', () => {
      const big = fileOfSize(MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL + 1);
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));

      act(() => result.current.addFiles([big]));

      expect(show).toHaveBeenCalledWith({
        text: 'modals.composeMessageDialog.errors.attachmentsTooLarge',
        type: ToastType.Warning,
      });
      expect(enqueue).not.toHaveBeenCalled();
      expect(result.current.attachments).toHaveLength(0);
    });

    test('When the cumulative size reaches the limit, then a subsequent batch is rejected', () => {
      const half = fileOfSize(MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL / 2);
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));

      act(() => result.current.addFiles([half]));
      act(() => lastCallbacks?.onSuccess('id-0', 'blob-0'));
      act(() => result.current.addFiles([fileOfSize(MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL / 2 + 1)]));

      expect(result.current.attachments).toHaveLength(1);
      expect(show).toHaveBeenCalledTimes(1);
    });
  });

  describe('upload callbacks', () => {
    test('When the manager reports success, then the attachment moves to done and the blobId is stored', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addFiles([fileOfSize(10)]));

      act(() => lastCallbacks?.onSuccess('id-0', 'blob-1'));

      expect(result.current.attachments[0]).toMatchObject({ status: 'done', blobId: 'blob-1' });
      expect(result.current.isUploading).toBe(false);
      expect(result.current.hasErrors).toBe(false);
    });

    test('When the manager reports an error, then the attachment moves to error', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addFiles([fileOfSize(10)]));

      act(() => lastCallbacks?.onError('id-0', new Error('boom')));

      expect(result.current.attachments[0].status).toBe('error');
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('retry', () => {
    test('When retry is called on a failed attachment, then it goes back to uploading and the manager is notified', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addFiles([fileOfSize(10)]));
      act(() => lastCallbacks?.onError('id-0', new Error('x')));

      act(() => result.current.retry('id-0'));

      expect(retryFn).toHaveBeenCalledWith('id-0');
      expect(result.current.attachments[0].status).toBe('uploading');
    });
  });

  describe('remove', () => {
    test('When remove is called, then the attachment is dropped and the manager is notified', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addFiles([fileOfSize(10, '1.txt'), fileOfSize(20, '2.txt')]));

      act(() => result.current.remove('id-0'));

      expect(cancel).toHaveBeenCalledWith('id-0');
      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].id).toBe('id-1');
    });
  });

  describe('clear', () => {
    test('When clear is called, then every attachment is removed from the manager and state', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addFiles([fileOfSize(10, '1.txt'), fileOfSize(20, '2.txt')]));

      act(() => result.current.clear());

      expect(clear).toHaveBeenCalledTimes(1);
      expect(result.current.attachments).toHaveLength(0);
    });
  });

  describe('inherited attachments', () => {
    const envelope = {
      version: 'v1',
      encryptedText: 'ct',
      encryptedPreview: 'cp',
      wrappedKeys: [],
      attachmentWrappedKeys: [],
    };

    const makeInherited = (overrides: Partial<InheritedAttachmentInput> = {}): InheritedAttachmentInput => ({
      originalMailId: 'mail-1',
      originalBlobId: 'blob-orig-1',
      originalEnvelope: envelope,
      name: 'photo.jpg',
      size: 500,
      type: 'image/jpeg',
      ...overrides,
    });

    test('When inheriting attachments from a forwarded email, then they appear in the list as ready-to-send', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));

      act(() =>
        result.current.addInheritedAttachments([
          makeInherited(),
          makeInherited({ name: 'doc.pdf', size: 200, originalBlobId: 'blob-orig-2' }),
        ]),
      );

      expect(result.current.attachments).toHaveLength(2);
      expect(result.current.attachments[0]).toMatchObject({
        kind: 'inherited',
        name: 'photo.jpg',
        size: 500,
        status: 'pending',
        originalMailId: 'mail-1',
        originalBlobId: 'blob-orig-1',
      });
      expect(result.current.attachments[1]).toMatchObject({
        kind: 'inherited',
        name: 'doc.pdf',
        status: 'pending',
      });
      expect(result.current.totalSize).toBe(700);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.hasErrors).toBe(false);
      expect(enqueue).not.toHaveBeenCalled();
    });

    test('When an inherited attachment is removed, then it is gone from the list', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addInheritedAttachments([makeInherited()]));

      const id = result.current.attachments[0].id;
      act(() => result.current.remove(id));

      expect(result.current.attachments).toHaveLength(0);
      expect(result.current.totalSize).toBe(0);
    });

    test('When inheriting attachments that would exceed the per-mail size limit, then the user is warned and they are not added', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));

      act(() =>
        result.current.addInheritedAttachments([makeInherited({ size: MAX_TOTAL_ATTACHMENT_BYTES_PER_MAIL + 1 })]),
      );

      expect(show).toHaveBeenCalledWith({
        text: 'modals.composeMessageDialog.errors.attachmentsTooLarge',
        type: ToastType.Warning,
      });
      expect(result.current.attachments).toHaveLength(0);
    });

    test('When markResolvingInherited is called, then the attachment moves to uploading', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addInheritedAttachments([makeInherited()]));
      const id = result.current.attachments[0].id;

      act(() => result.current.markResolvingInherited(id));

      expect(result.current.attachments[0].status).toBe('uploading');
      expect(result.current.isUploading).toBe(true);
    });

    test('When markInheritedResolved is called, then the attachment is done with the new blobId', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addInheritedAttachments([makeInherited()]));
      const id = result.current.attachments[0].id;

      act(() => result.current.markInheritedResolved(id, 'new-blob-id'));

      expect(result.current.attachments[0]).toMatchObject({ status: 'done', blobId: 'new-blob-id' });
      expect(result.current.isUploading).toBe(false);
      expect(result.current.hasErrors).toBe(false);
    });

    test('When markInheritedFailed is called, then the attachment moves to error', () => {
      const { result } = renderHook(() => useAttachments(new Uint8Array(32)));
      act(() => result.current.addInheritedAttachments([makeInherited()]));
      const id = result.current.attachments[0].id;

      act(() => result.current.markInheritedFailed(id));

      expect(result.current.attachments[0].status).toBe('error');
      expect(result.current.hasErrors).toBe(true);
    });
  });
});
