import { base64ToUint8Array, type HybridKeyPair } from 'internxt-crypto';
import {
  decryptEmailBody,
  decryptKeysHybrid,
  encryptEmailBody,
  encryptEmailBodyWithKey,
  encryptKeysHybrid,
} from 'internxt-crypto/email-crypto';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';

export type RecipientPublicKey = { address: string; publicKey: string };
export type EmailContent = { body: string; previewText: string };
type WrappedKey = EncryptionBlock['wrappedKeys'][number];
export type EncryptedSummary = { encryptedPreview: string; wrappedKeys: WrappedKey[] };
const PREVIEW_PLAINTEXT_LENGTH = 256;

function buildPreviewSnippet(previewText: string): string {
  return previewText.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_PLAINTEXT_LENGTH);
}

function secureShuffle<T>(items: T[]): T[] {
  const rand = new Uint32Array(1);
  for (let i = items.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = Math.floor(0x1_00_00_00_00 / range) * range;
    let value: number;
    do {
      crypto.getRandomValues(rand);
      value = rand[0];
    } while (value >= limit);
    const j = value % range;
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Only the body and preview are encrypted; the subject travels as cleartext so
 * the backend can index it.
 *
 * The wrapped keys ship as a de-identified, order-randomized array carrying no
 * recipient address, so the envelope hides the recipient set (Bcc included) —
 * each recipient finds their entry by trial decryption (see `decryptEnvelope`).
 */
export async function buildEncryptionBlock(
  content: EmailContent,
  recipients: RecipientPublicKey[],
): Promise<EncryptionBlock> {
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required to build the encryption block');
  }

  const { encEmailBody, encryptionKey } = await encryptEmailBody({ text: content.body });

  const { encText: encryptedPreview } = await encryptEmailBodyWithKey(
    { text: buildPreviewSnippet(content.previewText) },
    encryptionKey,
  );

  const wrapped = await Promise.all(
    recipients.map(async (r) => {
      const enc = await encryptKeysHybrid(encryptionKey, {
        email: r.address,
        publicHybridKey: base64ToUint8Array(r.publicKey),
      });
      return { hybridCiphertext: enc.hybridCiphertext, encryptedKey: enc.encryptedKey };
    }),
  );
  const wrappedKeys: WrappedKey[] = secureShuffle(wrapped);

  return {
    version: 'v1',
    encryptedText: encEmailBody.encText,
    encryptedPreview,
    wrappedKeys,
  };
}

export const ENCRYPTED_EMAIL_PREFIX = 'INTERNXT-ENCRYPTED-EMAIL-v1';

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
 * Trial-decrypts a ciphertext sealed with the shared body key. The wrapped keys
 * carry no recipient identifier, so we try each one and keep the entry whose key
 * yields a valid AEAD tag.
 *
 * @throws if none decrypt — the caller is not a recipient or holds the wrong key.
 */
async function trialDecrypt(wrappedKeys: WrappedKey[], ciphertextB64: string, keypair: HybridKeyPair): Promise<string> {
  for (const wrapped of wrappedKeys) {
    try {
      const bodyKey = await decryptKeysHybrid(
        { hybridCiphertext: wrapped.hybridCiphertext, encryptedKey: wrapped.encryptedKey, encryptedForEmail: '' },
        keypair.secretKey,
      );
      const { text } = await decryptEmailBody({ encText: ciphertextB64 }, bodyKey);
      return text;
    } catch {
      // No op, try the next one.
    }
  }
  throw new Error('Cannot decrypt envelope: not a recipient or wrong key');
}

export function decryptEnvelope(envelope: EncryptionBlock, keypair: HybridKeyPair): Promise<string> {
  return trialDecrypt(envelope.wrappedKeys, envelope.encryptedText, keypair);
}

export function decryptSummaryPreview(summary: EncryptedSummary, keypair: HybridKeyPair): Promise<string> {
  return trialDecrypt(summary.wrappedKeys, summary.encryptedPreview, keypair);
}
