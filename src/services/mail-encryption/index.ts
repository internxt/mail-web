import { base64ToUint8Array, encryptSymmetrically, type HybridKeyPair } from 'internxt-crypto';
import {
  decryptEmail,
  decryptKeysHybrid,
  encryptEmail,
  encryptEmailWithKey,
  encryptKeysHybrid,
} from 'internxt-crypto/email-crypto';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { BuildEncryptionBlockError, EnvelopeDecryptionError } from '@/errors/mail';

export type RecipientPublicKey = { address: string; publicKey: string };
export type EmailContent = { body: string; previewText: string };
type WrappedKey = EncryptionBlock['wrappedKeys'][number];
export type EncryptedSummary = { encryptedPreview: string; wrappedKeys: WrappedKey[] };
interface EncryptedAttachment {
  sessionKey: Uint8Array;
  encryptedFile: Uint8Array;
}
const PREVIEW_PLAINTEXT_LENGTH = 256;

export const ENCRYPTED_EMAIL_PREFIX = 'INTERNXT-ENCRYPTED-EMAIL-v1';

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

export class MailEncryptionService {
  public static readonly instance: MailEncryptionService = new MailEncryptionService();

  private constructor() {}

  /**
   * Only the body and preview are encrypted; the subject travels as cleartext so
   * the backend can index it.
   *
   * Both `wrappedKeys` and `attachmentWrappedKeys` ship as de-identified,
   * order-randomized arrays carrying no recipient address, so the envelope
   * hides the recipient set (Bcc included) — each recipient finds their entry
   * by trial decryption (see `decryptEnvelope`).
   *
   * `attachmentsSessionKey` is the symmetric key used to encrypt every
   * attachment blob in this email. It is wrapped per-recipient in
   * `attachmentWrappedKeys`, kept separate from the body key on purpose.
   */
  async buildEncryptionBlock(
    content: EmailContent,
    recipients: RecipientPublicKey[],
    attachmentsSessionKey: Uint8Array,
  ): Promise<EncryptionBlock> {
    if (recipients.length === 0) {
      throw new BuildEncryptionBlockError();
    }

    const { encEmail, encryptionKey } = await encryptEmail({ text: content.body });

    const { encText: encryptedPreview } = await encryptEmailWithKey(
      { text: buildPreviewSnippet(content.previewText) },
      encryptionKey,
    );

    const [wrappedKeys, attachmentWrappedKeys] = await Promise.all([
      Promise.all(recipients.map((r) => this.wrapKeyForRecipient(encryptionKey, r))).then(secureShuffle),
      Promise.all(recipients.map((r) => this.wrapKeyForRecipient(attachmentsSessionKey, r))).then(secureShuffle),
    ]);

    return {
      version: 'v1',
      encryptedText: encEmail.encText,
      encryptedPreview,
      wrappedKeys,
      attachmentWrappedKeys,
    };
  }

  private async wrapKeyForRecipient(key: Uint8Array, recipient: RecipientPublicKey): Promise<WrappedKey> {
    const enc = await encryptKeysHybrid(key, {
      email: recipient.address,
      publicHybridKey: base64ToUint8Array(recipient.publicKey),
    });
    return { hybridCiphertext: enc.hybridCiphertext, encryptedKey: enc.encryptedKey };
  }

  isEncryptedEmailBody(textBody: string | null | undefined): boolean {
    if (!textBody) return false;
    return textBody.startsWith(`${ENCRYPTED_EMAIL_PREFIX}\n`);
  }

  parseEncryptionBlock(textBody: string): EncryptionBlock {
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
  private async trialDecrypt(
    wrappedKeys: WrappedKey[],
    ciphertextB64: string,
    keypair: HybridKeyPair,
  ): Promise<string> {
    for (const wrapped of wrappedKeys) {
      try {
        const bodyKey = await decryptKeysHybrid(
          { hybridCiphertext: wrapped.hybridCiphertext, encryptedKey: wrapped.encryptedKey, encryptedForEmail: '' },
          keypair.secretKey,
        );
        const { text } = await decryptEmail({ encText: ciphertextB64 }, bodyKey);
        return text;
      } catch {
        // No op, try the next one.
      }
    }
    throw new EnvelopeDecryptionError();
  }

  /**
   * Decrypts the email body from its envelope using the caller's keypair.
   * @returns the cleartext body.
   * @throws {EnvelopeDecryptionError} if the caller is not a recipient (see `trialDecrypt`).
   */
  decryptEnvelope(envelope: EncryptionBlock, keypair: HybridKeyPair): Promise<string> {
    return this.trialDecrypt(envelope.wrappedKeys, envelope.encryptedText, keypair);
  }

  /**
   * Decrypts the list preview snippet from an encrypted summary using the caller's keypair.
   * @returns the cleartext preview snippet.
   * @throws {EnvelopeDecryptionError} if the caller is not a recipient (see `trialDecrypt`).
   */
  decryptSummaryPreview(summary: EncryptedSummary, keypair: HybridKeyPair): Promise<string> {
    return this.trialDecrypt(summary.wrappedKeys, summary.encryptedPreview, keypair);
  }

  /**
   * Trial-decrypts a wrapped key array and returns the raw key bytes. Same
   * de-identified semantics as `trialDecrypt`, but stops at the unwrapped key
   * rather than continuing to decrypt a payload with it.
   */
  private async trialDecryptKey(wrappedKeys: WrappedKey[], keypair: HybridKeyPair): Promise<Uint8Array> {
    for (const wrapped of wrappedKeys) {
      try {
        return await decryptKeysHybrid(
          { hybridCiphertext: wrapped.hybridCiphertext, encryptedKey: wrapped.encryptedKey, encryptedForEmail: '' },
          keypair.secretKey,
        );
      } catch {
        // No op, try the next one.
      }
    }
    throw new EnvelopeDecryptionError();
  }

  /**
   * Recovers the symmetric session key used to encrypt every attachment in the
   * email. Pair with `decryptSymmetrically` over the downloaded blob bytes.
   * @throws {EnvelopeDecryptionError} if the caller is not a recipient.
   */
  decryptAttachmentsSessionKey(envelope: EncryptionBlock, keypair: HybridKeyPair): Promise<Uint8Array> {
    return this.trialDecryptKey(envelope.attachmentWrappedKeys, keypair);
  }

  /**
   * Encrypt the attachment
   * @param sessionKey - The session key needed to encrypt the attachment
   * @param file - The attachment we want to encrypt
   * @returns - The encrypted attachment in the form of `EncryptedAttachment`
   */
  async encryptAttachment(sessionKey: Uint8Array<ArrayBufferLike>, file: File): Promise<EncryptedAttachment> {
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const encryptedFile = await encryptSymmetrically(sessionKey, fileBytes);
    return {
      sessionKey,
      encryptedFile,
    };
  }

  /**
   * Encrypt the session key for the attachments
   * @param sessionKey - The session key to encrypt
   * @param email - The email of the user to encrypt for
   * @param userPubKey - The user public key of the user to encrypt for
   * @returns - The hybrid ciphertext and encrypted key
   */
  async encryptAttachmentSessionKey(sessionKey: Uint8Array<ArrayBufferLike>, email: string, userPubKey: string) {
    const enc = await encryptKeysHybrid(sessionKey, {
      email,
      publicHybridKey: base64ToUint8Array(userPubKey),
    });
    return { hybridCiphertext: enc.hybridCiphertext, encryptedKey: enc.encryptedKey };
  }
}
