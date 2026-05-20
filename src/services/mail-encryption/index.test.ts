import { describe, expect, test } from 'vitest';
import { generateEmailKeys, uint8ArrayToBase64 } from 'internxt-crypto';
import {
  ENCRYPTED_EMAIL_PREFIX,
  buildEncryptionBlock,
  decryptEnvelope,
  isEncryptedEmailBody,
  parseEncryptionBlock,
  type RecipientPublicKey,
} from '.';

describe('buildEncryptionBlock + decryptEnvelope', () => {
  test('When a message is encrypted for one recipient, then that recipient can read the original content', async () => {
    const bob = await generateEmailKeys();

    const recipients: RecipientPublicKey[] = [{ address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) }];

    const envelope = await buildEncryptionBlock({ subject: 'hello', text: '<p>hi bob</p>' }, recipients);

    expect(envelope.version).toBe('v1');
    expect(envelope.wrappedKeys['bob@inxt.me']).toBeDefined();

    const plaintext = await decryptEnvelope(envelope, 'bob@inxt.me', bob);
    expect(plaintext.subject).toBe('hello');
    expect(plaintext.text).toBe('<p>hi bob</p>');
  });

  test('When a message is encrypted for multiple recipients, then each recipient can read the original content', async () => {
    const alice = await generateEmailKeys();
    const bob = await generateEmailKeys();

    const envelope = await buildEncryptionBlock({ subject: 'group hello', text: 'hey team' }, [
      { address: 'alice@inxt.me', publicKey: uint8ArrayToBase64(alice.publicKey) },
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    const aliceView = await decryptEnvelope(envelope, 'alice@inxt.me', alice);
    const bobView = await decryptEnvelope(envelope, 'bob@inxt.me', bob);

    expect(aliceView.text).toBe('hey team');
    expect(bobView.text).toBe('hey team');
  });

  test('When no recipients are provided, then encryption should fail', async () => {
    await expect(buildEncryptionBlock({ subject: 's', text: 't' }, [])).rejects.toThrow();
  });

  test('When decrypting with an address that was not a recipient, then decryption should fail', async () => {
    const bob = await generateEmailKeys();
    const envelope = await buildEncryptionBlock({ subject: 'x', text: 'y' }, [
      { address: 'bob@inxt.me', publicKey: uint8ArrayToBase64(bob.publicKey) },
    ]);

    await expect(decryptEnvelope(envelope, 'eve@inxt.me', bob)).rejects.toThrow();
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
      encryptedSubject: 'es',
      encryptedText: 'et',
      wrappedKeys: { 'a@inxt.me': { hybridCiphertext: 'h', encryptedKey: 'k' } },
    };
    const wire = `${ENCRYPTED_EMAIL_PREFIX}\n${Buffer.from(JSON.stringify(block)).toString('base64')}`;
    expect(parseEncryptionBlock(wire)).toStrictEqual(block);
  });
});
