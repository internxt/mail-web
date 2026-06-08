import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { HybridKeyPair } from 'internxt-crypto';
import type { EmailResponse } from '@internxt/sdk/dist/mail/types';
import { useDecryptedMail } from './useDecryptedMail';
import { useMailKeys } from './useMailKeys';
import { MailEncryptionService } from '@/services/mail-encryption';

vi.mock('./useMailKeys', () => ({ useMailKeys: vi.fn() }));

const mockKeys = vi.mocked(useMailKeys);

const keypair = {} as HybridKeyPair;
const envelope = { version: 'v1' } as ReturnType<MailEncryptionService['parseEncryptionBlock']>;

const spyOnEncryption = () => ({
  isEncrypted: vi.spyOn(MailEncryptionService.instance, 'isEncryptedEmailBody'),
  parse: vi.spyOn(MailEncryptionService.instance, 'parseEncryptionBlock'),
  decrypt: vi.spyOn(MailEncryptionService.instance, 'decryptEnvelope'),
});

let mailEncryption: ReturnType<typeof spyOnEncryption>;

const buildMail = (overrides: Partial<EmailResponse> = {}): EmailResponse =>
  ({
    id: 'mail-1',
    subject: 'Weekly sync notes',
    htmlBody: '<p>plain html</p>',
    textBody: 'encrypted-wire',
    ...overrides,
  }) as EmailResponse;

describe('useDecryptedMail', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mailEncryption = spyOnEncryption();
    mockKeys.mockReturnValue(keypair);
    mailEncryption.parse.mockReturnValue(envelope);
  });

  test('When there is no mail, then it reports an empty, non-encrypted state', () => {
    mailEncryption.isEncrypted.mockReturnValue(false);

    const { result } = renderHook(() => useDecryptedMail(undefined));

    expect(result.current).toStrictEqual({
      subject: '',
      htmlBody: '',
      isEncrypted: false,
      isDecrypting: false,
      decryptError: false,
      envelope: null,
    });
  });

  test('When the mail is not encrypted, then it returns the original content without decrypting', () => {
    mailEncryption.isEncrypted.mockReturnValue(false);
    const mail = buildMail();

    const { result } = renderHook(() => useDecryptedMail(mail));

    expect(result.current.subject).toBe('Weekly sync notes');
    expect(result.current.htmlBody).toBe('<p>plain html</p>');
    expect(result.current.isEncrypted).toBe(false);
    expect(mailEncryption.decrypt).not.toHaveBeenCalled();
  });

  test('When an encrypted mail is decrypted successfully, then it returns the decrypted body and clears the decrypting state', async () => {
    mailEncryption.isEncrypted.mockReturnValue(true);
    mailEncryption.decrypt.mockResolvedValue('the secret body');
    const mail = buildMail();

    const { result } = renderHook(() => useDecryptedMail(mail));

    await waitFor(() => expect(result.current.htmlBody).toBe('the secret body'));
    expect(result.current.isEncrypted).toBe(true);
    expect(result.current.isDecrypting).toBe(false);
    expect(result.current.decryptError).toBe(false);
  });

  test('When an encrypted mail cannot be decrypted, then it surfaces a decrypt error', async () => {
    mailEncryption.isEncrypted.mockReturnValue(true);
    mailEncryption.decrypt.mockRejectedValue(new Error('not a recipient'));
    const mail = buildMail();

    const { result } = renderHook(() => useDecryptedMail(mail));

    await waitFor(() => expect(result.current.decryptError).toBe(true));
    expect(result.current.htmlBody).toBe('');
    expect(result.current.isDecrypting).toBe(false);
  });

  test('While an encrypted mail is being decrypted, then it reports the decrypting state with the cleartext subject', () => {
    mailEncryption.isEncrypted.mockReturnValue(true);
    mailEncryption.decrypt.mockReturnValue(new Promise(() => undefined));
    const mail = buildMail();

    const { result } = renderHook(() => useDecryptedMail(mail));

    expect(result.current.isDecrypting).toBe(true);
    expect(result.current.subject).toBe('Weekly sync notes');
    expect(result.current.htmlBody).toBe('');
  });
});
