import { describe, expect, test } from 'vitest';
import { generateEmailKeys, uint8ArrayToBase64 } from 'internxt-crypto';
import {
  ENCRYPTED_EMAIL_PREFIX,
  buildEncryptionBlock,
  decryptEnvelope,
  decryptSummaryPreview,
  isEncryptedEmailBody,
  parseEncryptionBlock,
  type RecipientPublicKey,
} from '.';

const content = (body: string, previewText = body) => ({ body, previewText });

describe('buildEncryptionBlock + decryptEnvelope', () => {
  test('When a message is encrypted for one recipient, then that recipient can read the original body', async () => {
    const bob = await generateEmailKeys();

    const recipients: RecipientPublicKey[] = [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }];

    const envelope = await buildEncryptionBlock(content('<p>hi bob</p>'), recipients);

    expect(envelope.version).toBe('v1');
    expect(Array.isArray(envelope.wrappedKeys)).toBe(true);
    expect(envelope.wrappedKeys).toHaveLength(1);

    const text = await decryptEnvelope(envelope, bob);
    expect(text).toBe('<p>hi bob</p>');
  });

  test('When a message is encrypted, then the subject is never part of the envelope', async () => {
    const bob = await generateEmailKeys();

    const envelope = await buildEncryptionBlock(content('body'), [
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    expect(envelope).not.toHaveProperty('encryptedSubject');
  });

  test('When a message is encrypted for multiple recipients, then each recipient can read the original body', async () => {
    const alice = await generateEmailKeys();
    const bob = await generateEmailKeys();

    const envelope = await buildEncryptionBlock(content('hey team'), [
      { address: 'alice@inxt.me', publicKey: uint8ArrayToBase64(alice.publicKey) },
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    const aliceView = await decryptEnvelope(envelope, alice);
    const bobView = await decryptEnvelope(envelope, bob);

    expect(aliceView).toBe('hey team');
    expect(bobView).toBe('hey team');
  });

  test('When a multi-recipient message includes a Bcc, then the serialized envelope leaks no recipient address', async () => {
    const sender = await generateEmailKeys();
    const to = await generateEmailKeys();
    const cc = await generateEmailKeys();
    const bcc = await generateEmailKeys();

    const addresses = ['sender@inxt.me', 'to@inxt.me', 'cc@inxt.me', 'secret-bcc@inxt.me'];
    const envelope = await buildEncryptionBlock(content('hidden recipients'), [
      { address: addresses[0], publicKey: uint8ArrayToBase64(sender.publicKey) },
      { address: addresses[1], publicKey: uint8ArrayToBase64(to.publicKey) },
      { address: addresses[2], publicKey: uint8ArrayToBase64(cc.publicKey) },
      { address: addresses[3], publicKey: uint8ArrayToBase64(bcc.publicKey) },
    ]);

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

    expect(await decryptEnvelope(envelope, bcc)).toBe('hidden recipients');
    expect(await decryptEnvelope(envelope, sender)).toBe('hidden recipients');
    expect(await decryptEnvelope(envelope, to)).toBe('hidden recipients');
    expect(await decryptEnvelope(envelope, cc)).toBe('hidden recipients');
  });

  test('When no recipients are provided, then encryption should fail', async () => {
    await expect(buildEncryptionBlock(content('t'), [])).rejects.toThrow();
  });

  test('When decrypting with a key that was not a recipient, then decryption should fail cleanly', async () => {
    const bob = await generateEmailKeys();
    const eve = await generateEmailKeys();
    const envelope = await buildEncryptionBlock(content('y'), [
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    await expect(decryptEnvelope(envelope, eve)).rejects.toThrow(/not a recipient or wrong key/);
  });
});

describe('encrypted preview', () => {
  test('When the body is long, then the preview is a whitespace-collapsed truncation a recipient can decrypt', async () => {
    const bob = await generateEmailKeys();
    const previewText = `First line.\n\n   Second   line with   spaces.${' tail'.repeat(200)}`;

    const envelope = await buildEncryptionBlock({ body: '<p>full body</p>', previewText }, [
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    const preview = await decryptSummaryPreview(
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
    const envelope = await buildEncryptionBlock(content('<p>body</p>', 'snippet'), [
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    expect(
      await decryptSummaryPreview(
        { encryptedPreview: envelope.encryptedPreview, wrappedKeys: envelope.wrappedKeys },
        bob,
      ),
    ).toBe('snippet');
    await expect(
      decryptSummaryPreview({ encryptedPreview: envelope.encryptedPreview, wrappedKeys: envelope.wrappedKeys }, eve),
    ).rejects.toThrow(/not a recipient or wrong key/);
  });
});

describe('isEncryptedEmailBody / parseEncryptionBlock', () => {
  test('When checking whether a body is encrypted, then only prefixed bodies should be recognized as encrypted', () => {
    expect(isEncryptedEmailBody(`${ENCRYPTED_EMAIL_PREFIX}\nabc`)).toBe(true);
    expect(isEncryptedEmailBody('plain body')).toBe(false);
    expect(isEncryptedEmailBody(null)).toBe(false);
    expect(isEncryptedEmailBody(undefined)).toBe(false);
  });

  test('When the body contains a valid encrypted bundle, then it should parse the encryption block', () => {
    const block = {
      version: 'v1' as const,
      encryptedText: 'et',
      encryptedPreview: 'ep',
      wrappedKeys: [{ hybridCiphertext: 'h', encryptedKey: 'k' }],
    };
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\n${Buffer.from(JSON.stringify(block)).toString('base64')}`;
    expect(parseEncryptionBlock(wire)).toStrictEqual(block);
  });
});
