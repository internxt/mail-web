import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import useComposeSend from './useComposeSend';
import { MailEncryptionService } from '@/services/mail-encryption';
import { ConfigService } from '@/services/config';
import notificationsService from '@/services/notifications';
import type { Recipient } from '../types';

const mocks = vi.hoisted(() => ({
  activeDomains: undefined as { domain: string }[] | undefined,
  senderKeys: undefined as { address: string; publicKey: string } | undefined,
  triggerLookup: vi.fn(),
  sendEmail: vi.fn(),
  replyEmail: vi.fn(),
  deleteEmails: vi.fn(),
}));

vi.mock('@/store/api/mail', () => ({
  useGetActiveDomainsQuery: () => ({ data: mocks.activeDomains }),
  useGetMailAccountKeysQuery: () => ({ data: mocks.senderKeys }),
  useLazyLookupRecipientKeysQuery: () => [mocks.triggerLookup],
  useSendEmailMutation: () => [mocks.sendEmail, { isLoading: false }],
  useReplyEmailMutation: () => [mocks.replyEmail, { isLoading: false }],
  useDeleteMailsMutation: () => [mocks.deleteEmails],
}));

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@/services/notifications', () => ({
  default: { show: vi.fn() },
  ToastType: { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info', Loading: 'loading' },
}));

const editor = { getHTML: () => '<p>body</p>', getText: () => 'body' } as unknown as Editor;
const recipient = (email: string): Recipient => ({ id: email, email });
const show = vi.mocked(notificationsService.show);

const mockEncryptionBlock = {
  version: 'v3',
  encryptedText: 'ct',
  encryptedPreview: 'cp',
  encryptedAttachmentsSessionKey: 'ck',
  wrappedKeys: [],
};

const renderSend = (overrides: Partial<Parameters<typeof useComposeSend>[0]> = {}) => {
  const onSent = vi.fn();
  const markResolvingInherited = vi.fn();
  const markInheritedResolved = vi.fn();
  const markInheritedFailed = vi.fn();
  const { result } = renderHook(() =>
    useComposeSend({
      toRecipients: [],
      ccRecipients: [],
      bccRecipients: [],
      subject: 'Hi',
      editor,
      attachments: [],
      attachmentsSessionKey: new Uint8Array(32),
      onSent,
      markResolvingInherited,
      markInheritedResolved,
      markInheritedFailed,
      ...overrides,
    }),
  );
  return { result, onSent, markResolvingInherited, markInheritedResolved, markInheritedFailed };
};

describe('useComposeSend', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.triggerLookup.mockReset();
    mocks.sendEmail.mockReset();
    mocks.replyEmail.mockReset();
    mocks.deleteEmails.mockReset();
    show.mockReset();

    mocks.activeDomains = [{ domain: 'inxt.me' }];
    mocks.senderKeys = { address: 'me@inxt.me', publicKey: 'sender-pk' };
    mocks.triggerLookup.mockReturnValue({ unwrap: () => Promise.resolve([]) });
    mocks.sendEmail.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'mail-1' }) });
    mocks.replyEmail.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'reply-1' }) });
    mocks.deleteEmails.mockReturnValue({ unwrap: () => Promise.resolve(null) });
  });

  test('When there are no recipients, then it warns and does not send', async () => {
    const { result, onSent } = renderSend();

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.noRecipients' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the active domains have not resolved, then the send is blocked', async () => {
    mocks.activeDomains = undefined;
    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    expect(result.current.encryptionState).toBe('unknown');

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.encryptionUnavailable' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the sender keys are missing, then it reports a key lookup failure', async () => {
    mocks.senderKeys = undefined;
    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.keyLookupFailed' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the recipient key lookup throws, then it reports a key lookup failure', async () => {
    mocks.triggerLookup.mockReturnValue({ unwrap: () => Promise.reject(new Error('network')) });
    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.keyLookupFailed' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the send mutation fails, then it reports a send failure and does not close the dialog', async () => {
    mocks.triggerLookup.mockReturnValue({
      unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: 'bob-pk' }]),
    });
    vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);
    mocks.sendEmail.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) });

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.sendFailed' }));
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When all recipients are Internxt, then encryptionState is internxt and body is encrypted', async () => {
    mocks.triggerLookup.mockReturnValue({
      unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: 'bob-pk' }]),
    });
    const buildSpy = vi
      .spyOn(MailEncryptionService.instance, 'buildEncryptionBlock')
      .mockResolvedValue(mockEncryptionBlock);
    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    expect(result.current.encryptionState).toBe('internxt');

    await act(async () => {
      await result.current.send();
    });

    expect(buildSpy).toHaveBeenCalledWith(
      { body: '<p>body</p>', previewText: 'body' },
      expect.arrayContaining([
        { address: 'bob@inxt.me', publicKey: 'bob-pk' },
        { address: 'me@inxt.me', publicKey: 'sender-pk' },
      ]),
      expect.any(Uint8Array),
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ encryption: expect.objectContaining({ version: 'v3' }), deliveryMode: 'INTERNXT' }),
    );
    expect(onSent).toHaveBeenCalled();
  });

  test('When all recipients are Internxt and one is Bcc, then the send is blocked', async () => {
    const buildSpy = vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock');

    const { result, onSent } = renderSend({
      toRecipients: [recipient('bob@inxt.me')],
      bccRecipients: [recipient('carol@inxt.me')],
    });

    expect(result.current.encryptionState).toBe('internxt');

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.bccNotSupportedEncrypted' }));
    expect(buildSpy).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  describe('external recipients', () => {
    let getVariable: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      getVariable = vi.spyOn(ConfigService.instance, 'getVariable');
      getVariable.mockImplementation((key: string) => {
        if (key === 'SERVER_PUBLIC_KEY') return 'server-pk';
        throw new Error(`unmocked config key ${key}`);
      });
    });

    test('When there are external recipients, then encryptionState is external', () => {
      const { result } = renderSend({ toRecipients: [recipient('bob@gmail.com')] });
      expect(result.current.encryptionState).toBe('external');
    });

    test('When an external recipient has no publicKey, then SERVER_PUBLIC_KEY is used for their wrap', async () => {
      mocks.triggerLookup.mockReturnValue({
        unwrap: () =>
          Promise.resolve([
            { address: 'alice@inxt.me', publicKey: 'alice-pk' },
            { address: 'bob@gmail.com', publicKey: null },
          ]),
      });
      const buildSpy = vi
        .spyOn(MailEncryptionService.instance, 'buildEncryptionBlock')
        .mockResolvedValue(mockEncryptionBlock);

      const { result, onSent } = renderSend({
        toRecipients: [recipient('alice@inxt.me'), recipient('bob@gmail.com')],
      });

      await act(async () => {
        await result.current.send();
      });

      expect(buildSpy).toHaveBeenCalledWith(
        { body: '<p>body</p>', previewText: 'body' },
        expect.arrayContaining([
          { address: 'alice@inxt.me', publicKey: 'alice-pk' },
          { address: 'bob@gmail.com', publicKey: 'server-pk' },
          { address: 'me@inxt.me', publicKey: 'sender-pk' },
        ]),
        expect.any(Uint8Array),
      );
      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryMode: 'EXTERNAL', encryption: expect.objectContaining({ version: 'v3' }) }),
      );
      expect(onSent).toHaveBeenCalled();
    });

    test('When the server public key is not configured and there are external recipients, then it warns and does not send', async () => {
      getVariable.mockImplementation(() => {
        throw new Error('not configured');
      });
      mocks.triggerLookup.mockReturnValue({
        unwrap: () => Promise.resolve([{ address: 'bob@gmail.com', publicKey: null }]),
      });

      const { result, onSent } = renderSend({ toRecipients: [recipient('bob@gmail.com')] });

      await act(async () => {
        await result.current.send();
      });

      expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.encryptionUnavailable' }));
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });
  });

  describe('Internxt recipients without a public key', () => {
    test('When an Internxt recipient has no public key available, then the send is aborted to avoid weakening their encryption', async () => {
      const getVariable = vi.spyOn(ConfigService.instance, 'getVariable');
      getVariable.mockImplementation((key: string) => {
        if (key === 'SERVER_PUBLIC_KEY') return 'server-pk';
        throw new Error(`unmocked config key ${key}`);
      });
      mocks.triggerLookup.mockReturnValue({
        unwrap: () => Promise.resolve([{ address: 'alice@inxt.me', publicKey: null }]),
      });
      const buildSpy = vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock');

      const { result, onSent } = renderSend({ toRecipients: [recipient('alice@inxt.me')] });

      await act(async () => {
        await result.current.send();
      });

      expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.internxtKeyMissing' }));
      expect(buildSpy).not.toHaveBeenCalled();
      expect(getVariable).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });

    test('When one Internxt recipient is missing keys but another mix of recipients have them, then the send is still aborted', async () => {
      vi.spyOn(ConfigService.instance, 'getVariable').mockReturnValue('server-pk');
      mocks.triggerLookup.mockReturnValue({
        unwrap: () =>
          Promise.resolve([
            { address: 'alice@inxt.me', publicKey: 'alice-pk' },
            { address: 'carol@inxt.me', publicKey: null },
            { address: 'bob@gmail.com', publicKey: null },
          ]),
      });
      const buildSpy = vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock');

      const { result, onSent } = renderSend({
        toRecipients: [recipient('alice@inxt.me'), recipient('carol@inxt.me'), recipient('bob@gmail.com')],
      });

      await act(async () => {
        await result.current.send();
      });

      expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.internxtKeyMissing' }));
      expect(buildSpy).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });
  });

  describe('sending from a persisted draft', () => {
    beforeEach(() => {
      mocks.triggerLookup.mockReturnValue({
        unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: 'bob-pk' }]),
      });
      vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);
    });

    test('When sending an email opened from a draft, then the saved draft identifier is included in the send request so the server can consume it', async () => {
      const resolveDraftId = vi.fn().mockResolvedValue('draft-42');
      const { result, onSent } = renderSend({
        toRecipients: [recipient('bob@inxt.me')],
        resolveDraftId,
      });

      await act(async () => {
        await result.current.send();
      });

      expect(resolveDraftId).toHaveBeenCalled();
      expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ draftId: 'draft-42' }));
      expect(onSent).toHaveBeenCalled();
    });

    test('When sending a brand-new email with no saved draft, then the send request omits any draft identifier', async () => {
      const resolveDraftId = vi.fn().mockResolvedValue(null);
      const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')], resolveDraftId });

      await act(async () => {
        await result.current.send();
      });

      expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ draftId: undefined }));
      expect(onSent).toHaveBeenCalled();
    });
  });

  describe('Replying a message', () => {
    beforeEach(() => {
      mocks.triggerLookup.mockReturnValue({
        unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: 'bob-pk' }]),
      });
      vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue(mockEncryptionBlock);
    });

    test('When composing a reply, then it dispatches to the reply endpoint with the replied-to message id and not the send endpoint', async () => {
      const { result, onSent } = renderSend({
        toRecipients: [recipient('bob@inxt.me')],
        isReply: true,
        inReplyTo: 'msg-99',
      });

      await act(async () => {
        await result.current.send();
      });

      expect(mocks.replyEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-99',
          payload: expect.objectContaining({
            replyAll: false,
            encryption: expect.objectContaining({ version: 'v3' }),
          }),
        }),
      );
      const replyPayload = mocks.replyEmail.mock.calls[0][0].payload;
      expect(replyPayload).not.toHaveProperty('to');
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(onSent).toHaveBeenCalled();
    });

    test('When composing a reply-all, then the reply endpoint receives replyAll: true', async () => {
      const { result } = renderSend({
        toRecipients: [recipient('bob@inxt.me')],
        isReply: true,
        isReplyAll: true,
        inReplyTo: 'msg-99',
      });

      await act(async () => {
        await result.current.send();
      });

      expect(mocks.replyEmail).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ replyAll: true }) }),
      );
    });

    test('When it is a reply but the replied-to message cannot be resolved, then it fails instead of falling back to a standalone send', async () => {
      const { result, onSent } = renderSend({
        toRecipients: [recipient('bob@inxt.me')],
        isReply: true,
        inReplyTo: undefined,
      });

      await act(async () => {
        await result.current.send();
      });

      expect(mocks.replyEmail).not.toHaveBeenCalled();
      expect(mocks.sendEmail).not.toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });

    test('When the reply mutation fails, then it reports a reply failure and does not close the dialog', async () => {
      mocks.replyEmail.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) });
      const { result, onSent } = renderSend({
        toRecipients: [recipient('bob@inxt.me')],
        isReply: true,
        inReplyTo: 'msg-99',
      });

      await act(async () => {
        await result.current.send();
      });

      expect(show).toHaveBeenCalled();
      expect(onSent).not.toHaveBeenCalled();
    });
  });
});
