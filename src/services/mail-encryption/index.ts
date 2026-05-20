import {
  base64ToUint8Array,
  decryptEmailHybrid,
  encryptEmailHybridForMultipleRecipients,
  type EmailBody,
  type HybridEncryptedEmail,
  type HybridKeyPair,
} from 'internxt-crypto';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';

export type RecipientPublicKey = { address: string; publicKey: string };

/**
 * Builds the on-the-wire encryption bundle for a send. All recipients share
 * the same symmetric body ciphertext; each gets their own wrapped key.
 *
 * `publicKey` is the recipient's hybrid (X25519 + ML-KEM-768 / X-Wing) key,
 * base64-encoded as returned by the backend lookup endpoint.
 */
export async function buildEncryptionBlock(
  email: EmailBody,
  recipients: RecipientPublicKey[],
): Promise<EncryptionBlock> {
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required to build the encryption block');
  }

  const recipientsWithBytes = recipients.map((r) => ({
    email: r.address,
    publicHybridKey: base64ToUint8Array(r.publicKey),
  }));

  const sealed = await encryptEmailHybridForMultipleRecipients(email, recipientsWithBytes);

  const wrappedKeys: EncryptionBlock['wrappedKeys'] = {};
  for (const s of sealed) {
    wrappedKeys[s.encryptedKey.encryptedForEmail] = {
      hybridCiphertext: s.encryptedKey.hybridCiphertext,
      encryptedKey: s.encryptedKey.encryptedKey,
    };
  }

  return {
    version: 'v1',
    encryptedSubject: sealed[0].encEmailBody.encSubject,
    encryptedText: sealed[0].encEmailBody.encText,
    wrappedKeys,
  };
}

export const ENCRYPTED_EMAIL_PREFIX = 'INTERNXT-ENCRYPTED-EMAIL-v1';

/**
 * Detects the encryption envelope marker in a body. The backend wraps every
 * encrypted send as `INTERNXT-ENCRYPTED-EMAIL-v1\n<base64(json)>` (see
 * `mail/src/modules/email/email.service.ts`).
 */
export function isEncryptedEmailBody(textBody: string | null | undefined): boolean {
  if (!textBody) return false;
  return textBody.startsWith(`${ENCRYPTED_EMAIL_PREFIX}\n`);
}

export function parseEncryptionBlock(textBody: string): EncryptionBlock {
  const payload = textBody.slice(ENCRYPTED_EMAIL_PREFIX.length + 1);
  const json = typeof atob === 'function' ? atob(payload) : Buffer.from(payload, 'base64').toString('utf8');
  return JSON.parse(json) as EncryptionBlock;
}

/**
 * Decrypts an envelope using the recipient's hybrid keypair. The recipient
 * address must match one of the wrappedKeys entries.
 */
export async function decryptEnvelope(
  envelope: EncryptionBlock,
  recipientAddress: string,
  keypair: HybridKeyPair,
): Promise<EmailBody> {
  const wrapped = envelope.wrappedKeys[recipientAddress];
  if (!wrapped) {
    throw new Error(`No wrapped key found for ${recipientAddress}`);
  }
  const sealed: HybridEncryptedEmail = {
    encryptedKey: {
      hybridCiphertext: wrapped.hybridCiphertext,
      encryptedKey: wrapped.encryptedKey,
      encryptedForEmail: recipientAddress,
    },
    encEmailBody: {
      encText: envelope.encryptedText,
      encSubject: envelope.encryptedSubject,
    },
  };
  return decryptEmailHybrid(sealed, keypair.secretKey);
}
