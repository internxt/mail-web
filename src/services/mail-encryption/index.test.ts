import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateEmailKeys, genSymmetricKey, uint8ArrayToBase64 } from 'internxt-crypto';
import { ENCRYPTED_EMAIL_PREFIX, MailEncryptionService, type RecipientPublicKey } from '.';
import { MailKeysService } from '../mail-keys';
import { getMockedMail } from '@/test-utils/fixtures';

const mailEncryption = MailEncryptionService.instance;
const content = (body: string, previewText = body) => ({ body, previewText });
const attachmentsKey = () => genSymmetricKey();

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('buildEncryptionBlock + decryptEnvelope', () => {
  test('When a message is encrypted for one recipient, then that recipient can read the original body', async () => {
    const bob = await generateEmailKeys();

    const recipients: RecipientPublicKey[] = [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }];

    const envelope = await mailEncryption.buildEncryptionBlock(content('<p>hi bob</p>'), recipients, attachmentsKey());

    expect(envelope.version).toBe('v1');
    expect(Array.isArray(envelope.wrappedKeys)).toBe(true);
    expect(envelope.wrappedKeys).toHaveLength(1);

    const text = await mailEncryption.decryptEnvelope(envelope, bob);
    expect(text).toBe('<p>hi bob</p>');
  });

  test('When a message is encrypted, then the subject is never part of the envelope', async () => {
    const bob = await generateEmailKeys();

    const envelope = await mailEncryption.buildEncryptionBlock(
      content('body'),
      [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }],
      attachmentsKey(),
    );

    expect(envelope).not.toHaveProperty('encryptedSubject');
  });

  test('When a message is encrypted for multiple recipients, then each recipient can read the original body', async () => {
    const alice = await generateEmailKeys();
    const bob = await generateEmailKeys();

    const envelope = await mailEncryption.buildEncryptionBlock(
      content('hey team'),
      [
        { address: 'alice@inxt.me', publicKey: uint8ArrayToBase64(alice.publicKey) },
        { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
      ],
      attachmentsKey(),
    );

    const aliceView = await mailEncryption.decryptEnvelope(envelope, alice);
    const bobView = await mailEncryption.decryptEnvelope(envelope, bob);

    expect(aliceView).toBe('hey team');
    expect(bobView).toBe('hey team');
  });

  test('When a multi-recipient message includes a Bcc, then the serialized envelope leaks no recipient address', async () => {
    const sender = await generateEmailKeys();
    const to = await generateEmailKeys();
    const cc = await generateEmailKeys();
    const bcc = await generateEmailKeys();

    const addresses = ['sender@inxt.me', 'to@inxt.me', 'cc@inxt.me', 'secret-bcc@inxt.me'];
    const envelope = await mailEncryption.buildEncryptionBlock(
      content('hidden recipients'),
      [
        { address: addresses[0], publicKey: uint8ArrayToBase64(sender.publicKey) },
        { address: addresses[1], publicKey: uint8ArrayToBase64(to.publicKey) },
        { address: addresses[2], publicKey: uint8ArrayToBase64(cc.publicKey) },
        { address: addresses[3], publicKey: uint8ArrayToBase64(bcc.publicKey) },
      ],
      attachmentsKey(),
    );

    const wire = `${ENCRYPTED_EMAIL_PREFIX}\n${Buffer.from(JSON.stringify(envelope)).toString('base64')}`;
    const serialized = JSON.stringify(envelope);
    for (const addr of addresses) {
      expect(serialized).not.toContain(addr);
      expect(wire).not.toContain(addr);
    }
    expect(serialized).not.toContain('secret-bcc');

    expect(envelope.wrappedKeys).toHaveLength(4);
    for (const entry of envelope.wrappedKeys) {
      expect(Object.keys(entry).sort()).toStrictEqual(['encryptedKey', 'hybridCiphertext']);
    }

    expect(await mailEncryption.decryptEnvelope(envelope, bcc)).toBe('hidden recipients');
    expect(await mailEncryption.decryptEnvelope(envelope, sender)).toBe('hidden recipients');
    expect(await mailEncryption.decryptEnvelope(envelope, to)).toBe('hidden recipients');
    expect(await mailEncryption.decryptEnvelope(envelope, cc)).toBe('hidden recipients');
  });

  test('When no recipients are provided, then encryption should fail', async () => {
    await expect(mailEncryption.buildEncryptionBlock(content('t'), [], attachmentsKey())).rejects.toThrow();
  });

  test('When decrypting with a key that was not a recipient, then decryption should fail cleanly', async () => {
    const bob = await generateEmailKeys();
    const eve = await generateEmailKeys();
    const envelope = await mailEncryption.buildEncryptionBlock(
      content('y'),
      [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }],
      attachmentsKey(),
    );

    await expect(mailEncryption.decryptEnvelope(envelope, eve)).rejects.toThrow(/not a recipient or wrong key/);
  });
});

describe('encrypted preview', () => {
  test('When the body is long, then the preview is a whitespace-collapsed truncation a recipient can decrypt', async () => {
    const bob = await generateEmailKeys();
    const previewText = `First line.\n\n   Second   line with   spaces.${' tail'.repeat(200)}`;

    const envelope = await mailEncryption.buildEncryptionBlock(
      { body: '<p>full body</p>', previewText },
      [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }],
      attachmentsKey(),
    );

    const preview = await mailEncryption.decryptSummaryPreview(
      { encryptedPreview: envelope.encryptedPreview, wrappedKeys: envelope.wrappedKeys },
      bob,
    );

    expect(preview.length).toBe(256);
    expect(preview.startsWith('First line. Second line with spaces.')).toBe(true);
    expect(preview).not.toContain('\n');
  });

  test('When a non-recipient tries to read the preview, then it fails cleanly', async () => {
    const bob = await generateEmailKeys();
    const eve = await generateEmailKeys();
    const envelope = await mailEncryption.buildEncryptionBlock(
      content('<p>body</p>', 'snippet'),
      [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }],
      attachmentsKey(),
    );

    expect(
      await mailEncryption.decryptSummaryPreview(
        { encryptedPreview: envelope.encryptedPreview, wrappedKeys: envelope.wrappedKeys },
        bob,
      ),
    ).toBe('snippet');
    await expect(
      mailEncryption.decryptSummaryPreview(
        { encryptedPreview: envelope.encryptedPreview, wrappedKeys: envelope.wrappedKeys },
        eve,
      ),
    ).rejects.toThrow(/not a recipient or wrong key/);
  });
});

describe('isEncryptedEmailBody / parseEncryptionBlock', () => {
  test('When checking whether a body is encrypted, then only prefixed bodies should be recognized as encrypted', () => {
    expect(mailEncryption.isEncryptedEmailBody(`${ENCRYPTED_EMAIL_PREFIX}\nabc`)).toBe(true);
    expect(mailEncryption.isEncryptedEmailBody('plain body')).toBe(false);
    expect(mailEncryption.isEncryptedEmailBody(null)).toBe(false);
    expect(mailEncryption.isEncryptedEmailBody(undefined)).toBe(false);
  });

  test('When the body contains a valid encrypted bundle, then it should parse the encryption block', () => {
    const block = {
      version: 'v1' as const,
      encryptedText: 'et',
      encryptedPreview: 'ep',
      wrappedKeys: [{ hybridCiphertext: 'h', encryptedKey: 'k' }],
    };
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\n${Buffer.from(JSON.stringify(block)).toString('base64')}`;
    expect(mailEncryption.parseEncryptionBlock(wire)).toStrictEqual(block);
  });
});

describe('Decrypting body email', () => {
  beforeEach(() => {
    MailKeysService.instance.clear();
  });

  test('When the mail arrives in plain text, then its readable body is returned as is', async () => {
    const mail = getMockedMail({ textBody: 'plain text', htmlBody: '<p>plain</p>' });

    const result = await mailEncryption.decryptMailBody(mail);

    expect(result).toEqual({
      ok: true,
      isEncrypted: false,
      envelope: null,
      text: '<p>plain</p>',
    });
  });

  test('When the mail has no html version, then the plain text body is used as the readable body', async () => {
    const mail = getMockedMail({ textBody: 'plain text', htmlBody: '' });

    const result = await mailEncryption.decryptMailBody(mail);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe('plain text');
      expect(result.isEncrypted).toBe(false);
      expect(result.envelope).toBeNull();
    }
  });

  test('When the mail is encrypted but the user has not unlocked their keys yet, then the failure is reported without trying to read the contents', async () => {
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\nfake`;
    const mail = getMockedMail({ textBody: wire });

    const result = await mailEncryption.decryptMailBody(mail);

    expect(result).toEqual({
      ok: false,
      isEncrypted: true,
      reason: 'no-keys',
      decryptError: expect.any(String),
    });
  });

  test('When the encrypted contents are corrupted, then the failure is reported and the email is still flagged as encrypted', async () => {
    const bob = await generateEmailKeys();
    MailKeysService.instance.set('bob@inxt.me', bob);
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\nnot-base64`;
    const mail = getMockedMail({ textBody: wire });

    const result = await mailEncryption.decryptMailBody(mail);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('decrypt-failed');
      expect(result.isEncrypted).toBe(true);
      expect(typeof result.decryptError).toBe('string');
    }
  });

  test('When the mail is encrypted and the recipient can unlock it, then its readable body is returned', async () => {
    const bob = await generateEmailKeys();
    MailKeysService.instance.set('bob@inxt.me', bob);

    const envelope = await mailEncryption.buildEncryptionBlock(
      content('<p>secret</p>'),
      [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }],
      attachmentsKey(),
    );
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\n${Buffer.from(JSON.stringify(envelope)).toString('base64')}`;
    const mail = getMockedMail({ textBody: wire });

    const result = await mailEncryption.decryptMailBody(mail);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe('<p>secret</p>');
      expect(result.isEncrypted).toBe(true);
      expect(result.envelope).toEqual(envelope);
    }
  });
});
