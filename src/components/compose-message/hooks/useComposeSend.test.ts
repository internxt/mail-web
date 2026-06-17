import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Editor } from '@tiptap/react';
import useComposeSend from './useComposeSend';
import { MailEncryptionService } from '@/services/mail-encryption';
import notificationsService from '@/services/notifications';
import type { Recipient } from '../types';

const mocks = vi.hoisted(() => ({
  activeDomains: undefined as { domain: string }[] | undefined,
  senderKeys: undefined as { address: string; publicKey: string } | undefined,
  triggerLookup: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('@/store/api/mail', () => ({
  useGetActiveDomainsQuery: () => ({ data: mocks.activeDomains }),
  useGetMailAccountKeysQuery: () => ({ data: mocks.senderKeys }),
  useLazyLookupRecipientKeysQuery: () => [mocks.triggerLookup],
  useSendEmailMutation: () => [mocks.sendEmail, { isLoading: false }],
}));

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@/services/notifications', () => ({
  default: { show: vi.fn() },
  ToastType: { Success: 'success', Error: 'error', Warning: 'warning', Info: 'info', Loading: 'loading' },
}));

const editor = { getHTML: () => '<p>body</p>', getText: () => 'body' } as unknown as Editor;
const recipient = (email: string): Recipient => ({ id: email, email });
const show = vi.mocked(notificationsService.show);

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
    show.mockReset();

    mocks.activeDomains = [{ domain: 'inxt.me' }];
    mocks.senderKeys = { address: 'me@inxt.me', publicKey: 'sender-pk' };
    mocks.triggerLookup.mockReturnValue({ unwrap: () => Promise.resolve([]) });
    mocks.sendEmail.mockReturnValue({ unwrap: () => Promise.resolve({ id: 'mail-1' }) });
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

  test('When the active domains have not resolved, then the send is blocked to avoid a cleartext downgrade', async () => {
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

  test('When sending encrypted but the sender keys are missing, then it reports a key lookup failure', async () => {
    mocks.senderKeys = undefined;

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.keyLookupFailed' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the recipient key lookup throws, then it reports a key lookup failure rather than a send failure', async () => {
    mocks.triggerLookup.mockReturnValue({ unwrap: () => Promise.reject(new Error('network')) });

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.keyLookupFailed' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When some recipients have no key, then it reports a key lookup failure', async () => {
    mocks.triggerLookup.mockReturnValue({
      unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: null }]),
    });

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.keyLookupFailed' }));
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When the send mutation fails, then it reports a send failure and does not close the dialog', async () => {
    mocks.sendEmail.mockReturnValue({ unwrap: () => Promise.reject(new Error('boom')) });

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@gmail.com')] });

    expect(result.current.encryptionState).toBe('cleartext');

    await act(async () => {
      await result.current.send();
    });

    expect(show).toHaveBeenCalledWith(expect.objectContaining({ text: 'errors.mail.sendFailed' }));
    expect(onSent).not.toHaveBeenCalled();
  });

  test('When all recipients are external, then it sends cleartext and closes the dialog', async () => {
    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@gmail.com')] });

    expect(result.current.encryptionState).toBe('cleartext');

    await act(async () => {
      await result.current.send();
    });

    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: 'bob@gmail.com' }],
        subject: 'Hi',
        htmlBody: '<p>body</p>',
        textBody: 'body',
      }),
    );
    expect(onSent).toHaveBeenCalled();
  });

  test('When all recipients are Internxt, then it encrypts the body and sends with the sender included', async () => {
    mocks.triggerLookup.mockReturnValue({
      unwrap: () => Promise.resolve([{ address: 'bob@inxt.me', publicKey: 'bob-pk' }]),
    });
    const buildSpy = vi.spyOn(MailEncryptionService.instance, 'buildEncryptionBlock').mockResolvedValue({
      version: 'v1',
      encryptedText: 'ct',
      encryptedPreview: 'cp',
      wrappedKeys: [],
      attachmentWrappedKeys: [],
    });

    const { result, onSent } = renderSend({ toRecipients: [recipient('bob@inxt.me')] });

    expect(result.current.encryptionState).toBe('encrypted');

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
      expect.objectContaining({ subject: 'Hi', encryption: expect.objectContaining({ version: 'v1' }) }),
    );
    expect(onSent).toHaveBeenCalled();
  });
});
