import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import { useDraftMessage } from './useDraftMessage';
import { MailEncryptionService } from '@/services/mail-encryption';
import type { Recipient } from '../types';
import type { AttachmentTask } from './useAttachments';

const mocks = vi.hoisted(() => ({
  senderKeys: undefined as { address: string; publicKey: string } | undefined,
  createDraft: vi.fn(),
  updateDraft: vi.fn(),
  discardDraft: vi.fn(),
  resetDiscardDraft: vi.fn(),
}));

vi.mock('@/store/api/mail', () => ({
  useDraftEmailMutation: () => [mocks.createDraft],
  useUpdateDraftMutation: () => [mocks.updateDraft],
  useDiscardDraftMutation: () => [mocks.discardDraft, { isLoading: false, reset: mocks.resetDiscardDraft }],
  useGetMailAccountKeysQuery: () => ({ data: mocks.senderKeys }),
}));

const editor = { getHTML: () => '<p>hi</p>', getText: () => 'hi', on: vi.fn(), off: vi.fn() } as unknown as Editor;
const recipient = (email: string): Recipient => ({ id: email, email });

const mockEncryptionBlock = {
  version: 'v3',
  encryptedText: 'ct',
  encryptedPreview: 'cp',
  encryptedAttachmentsSessionKey: 'ck',
  wrappedKeys: [],
};

const renderDraft = (overrides: Partial<Parameters<typeof useDraftMessage>[0]> = {}) => {
  return renderHook(() =>
    useDraftMessage({
      attachments: [],
      toRecipients: [],
      ccRecipients: [],
      bccRecipients: [],
      subject: '',
      editor,
      attachmentsSessionKey: new Uint8Array(32),
      isDraftActive: true,
      ...overrides,
    }),
  );
};

describe('Draft Message', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    mocks.createDraft.mockReset();
    mocks.updateDraft.mockReset();
    mocks.discardDraft.mockReset();
    mocks.resetDiscardDraft.mockReset();
    mocks.senderKeys = { address: 'me@inxt.me', publicKey: 'sender-pk' };
    mocks.createDraft.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'new-draft-1', receivedAt: '2026-06-22T13:42:30Z' }),
    });
    mocks.updateDraft.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'new-draft-1', receivedAt: '2026-06-22T13:42:30Z' }),
    });
  });

  test('When autosaving, then the payload is built with an encryption block wrapped only for the sender', async () => {
    const buildSpy = vi
      .spyOn(MailEncryptionService.instance, 'buildEncryptionBlock')
      .mockResolvedValue(mockEncryptionBlock);

    const { result } = renderDraft({ subject: 'A subject', toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(buildSpy).toHaveBeenCalledWith(
      { body: '<p>hi</p>', previewText: 'hi' },
      [{ address: 'me@inxt.me', publicKey: 'sender-pk' }],
      expect.any(Uint8Array),
    );
    expect(mocks.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'A subject',
        to: [{ email: 'bob@inxt.me' }],
        encryption: expect.objectContaining({ version: 'v3' }),
      }),
    );
  });

  test('When a new compose is empty, then the draft is not created', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);
    const emptyEditor = { getHTML: () => '<p></p>', getText: () => '', on: vi.fn(), off: vi.fn() } as unknown as Editor;

    const { result } = renderDraft({ editor: emptyEditor });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mocks.createDraft).not.toHaveBeenCalled();
    expect(mocks.updateDraft).not.toHaveBeenCalled();
  });

  test('When sender keys are not available, then autosave is skipped silently', async () => {
    mocks.senderKeys = undefined;
    const buildSpy = vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock');

    const { result } = renderDraft({ subject: 'Whatever', toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(buildSpy).not.toHaveBeenCalled();
    expect(mocks.createDraft).not.toHaveBeenCalled();
    expect(mocks.updateDraft).not.toHaveBeenCalled();
  });

  test('When only done attachments exist, then only those are included in the payload', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    const attachments: AttachmentTask[] = [
      {
        kind: 'uploaded',
        id: 'a-1',
        name: 'ready.pdf',
        size: 10,
        type: 'application/pdf',
        status: 'done',
        blobId: 'blob-ready',
      },
      {
        kind: 'uploaded',
        id: 'a-2',
        name: 'still-uploading.bin',
        size: 20,
        type: 'application/octet-stream',
        status: 'uploading',
      },
    ];

    const { result } = renderDraft({ attachments, toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mocks.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ blobId: 'blob-ready', name: 'ready.pdf', size: 10, type: 'application/pdf' }],
      }),
    );
  });

  test('When the first save completes, then the returned draftId is remembered for subsequent autosaves', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    const { result, rerender } = renderHook((props: Parameters<typeof useDraftMessage>[0]) => useDraftMessage(props), {
      initialProps: {
        attachments: [] as AttachmentTask[],
        toRecipients: [recipient('bob@inxt.me')],
        ccRecipients: [] as Recipient[],
        bccRecipients: [] as Recipient[],
        subject: 'First',
        editor,
        attachmentsSessionKey: new Uint8Array(32),
        isDraftActive: true,
      },
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    rerender({
      attachments: [],
      toRecipients: [recipient('bob@inxt.me')],
      ccRecipients: [],
      bccRecipients: [],
      subject: 'Second',
      editor,
      attachmentsSessionKey: new Uint8Array(32),
      isDraftActive: true,
    });

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(mocks.createDraft).toHaveBeenCalledTimes(1);
    expect(mocks.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ draftId: 'new-draft-1' }));
  });

  test('When a save is triggered while another is in flight, then it waits and updates instead of creating a duplicate', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    let resolveCreate!: (value: { id: string; receivedAt: string }) => void;
    mocks.createDraft.mockReturnValue({
      unwrap: () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    });

    const { result } = renderDraft({ subject: 'Racy', toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      const first = result.current.saveDraft();
      const second = result.current.saveDraft();

      await vi.advanceTimersByTimeAsync(0);

      resolveCreate({ id: 'new-draft-1', receivedAt: '2026-06-22T13:42:30Z' });
      await Promise.all([first, second]);
    });

    expect(mocks.createDraft).toHaveBeenCalledTimes(1);
    expect(mocks.updateDraft).toHaveBeenCalledTimes(1);
    expect(mocks.updateDraft).toHaveBeenCalledWith(expect.objectContaining({ draftId: 'new-draft-1' }));
  });

  test('When resolving the draft id before send, then it waits for the in-flight save and returns the fresh draft id', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    let resolveCreate!: (value: { id: string; receivedAt: string }) => void;
    mocks.createDraft.mockReturnValue({
      unwrap: () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    });

    const { result } = renderDraft({ subject: 'Send race', toRecipients: [recipient('bob@inxt.me')] });

    let resolvedId: string | null = null;
    await act(async () => {
      const save = result.current.saveDraft();
      await vi.advanceTimersByTimeAsync(0);
      const resolve = result.current.resolveDraftId();
      resolveCreate({ id: 'new-draft-1', receivedAt: '2026-06-22T13:42:30Z' });
      [, resolvedId] = await Promise.all([save, resolve]);
    });

    expect(resolvedId).toBe('new-draft-1');
  });

  test('When discarding while a save is in flight, then it waits for the save to resolve and discards the fresh draft id', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    let resolveCreate!: (value: { id: string; receivedAt: string }) => void;
    mocks.createDraft.mockReturnValue({
      unwrap: () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    });
    mocks.discardDraft.mockReturnValue({ unwrap: () => Promise.resolve(undefined) });

    const { result } = renderDraft({ subject: 'Discard race', toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      const save = result.current.saveDraft();
      await vi.advanceTimersByTimeAsync(0);
      const discard = result.current.handleDraftDiscard();
      resolveCreate({ id: 'new-draft-1', receivedAt: '2026-06-22T13:42:30Z' });
      await Promise.all([save, discard]);
    });

    expect(mocks.discardDraft).toHaveBeenCalledWith({ draftId: 'new-draft-1' });
  });

  test('When the body is edited, then autosave re-arms from the editor update event', async () => {
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);

    let updateHandler: (() => void) | undefined;
    const typedEditor = {
      getHTML: () => '<p>hi</p>',
      getText: () => 'hi',
      on: (event: string, cb: () => void) => {
        if (event === 'update') updateHandler = cb;
      },
      off: vi.fn(),
    } as unknown as Editor;

    renderDraft({ editor: typedEditor, subject: 'Typing' });
    expect(updateHandler).toBeDefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
      updateHandler!();
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(mocks.createDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(mocks.createDraft).toHaveBeenCalledTimes(1);
  });

  describe('replying', () => {
    beforeEach(() => {
      vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);
    });

    test('When composing a reply, then no draft is ever persisted', async () => {
      const { result } = renderDraft({
        subject: 'Re: hi',
        toRecipients: [recipient('bob@inxt.me')],
        isDraftActive: false,
      });

      await act(async () => {
        await result.current.saveDraft();
      });

      expect(mocks.createDraft).not.toHaveBeenCalled();
      expect(mocks.updateDraft).not.toHaveBeenCalled();
    });
  });
});
