import { base64ToUint8Array, encryptSymmetrically, type HybridKeyPair } from 'internxt-crypto';
import { decryptEmailHybrid, encryptEmailHybridForMultipleRecipients } from 'internxt-crypto/email-crypto';
import type { EmailResponse, EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { BuildEncryptionBlockError, EnvelopeDecryptionError } from '@/errors/mail';
import { MailKeysService } from '../mail-keys';
import { ErrorService } from '../error';

export type RecipientPublicKey = { address: string; publicKey: string };
export type EmailContent = { body: string; previewText: string };
type WrappedKey = EncryptionBlock['wrappedKeys'][number];
export type EncryptedSummary = { encryptedPreview: string; wrappedKeys: WrappedKey[] };
interface EncryptedAttachment {
  sessionKey: Uint8Array;
  encryptedFile: Uint8Array;
}
export type DecryptedMailBody =
  | { ok: true; text: string; envelope: EncryptionBlock | null; isEncrypted: boolean }
  | { ok: false; decryptError: string; isEncrypted: true; reason: 'no-keys' | 'decrypt-failed' };

const PREVIEW_PLAINTEXT_LENGTH = 256;

export const ENCRYPTED_EMAIL_PREFIX = 'INTERNXT-ENCRYPTED-EMAIL-v1';

function buildPreviewSnippet(previewText: string): string {
  return previewText.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_PLAINTEXT_LENGTH);
}

export class MailEncryptionService {
  public static readonly instance: MailEncryptionService = new MailEncryptionService();

  private constructor() {}

  /**
   * Only the body, preview and attachments session key are encrypted; the
   * subject travels as cleartext so the backend can index it.
   *
   * A single session key seals all three ciphertexts, so one wrapped key per
   * recipient unlocks everything. Every wrapped key is labeled with the
   * recipient address it was encrypted for (`encryptedForEmail`), so each
   * recipient finds their entry with a direct lookup — no trial decryption.
   * Because the labels expose the full recipient set to anyone holding the
   * envelope, Bcc recipients must not be part of an encrypted send (compose
   * enforces this).
   */
  async buildEncryptionBlock(
    content: EmailContent,
    recipients: RecipientPublicKey[],
    attachmentsSessionKey: Uint8Array,
  ): Promise<EncryptionBlock> {
    if (recipients.length === 0) {
      throw new BuildEncryptionBlockError();
    }

    const recipientsWithKeys = recipients.map((r) => ({
      email: r.address,
      publicHybridKey: base64ToUint8Array(r.publicKey),
    }));

    const { encryptedKeys, encEmail } = await encryptEmailHybridForMultipleRecipients(
      {
        text: content.body,
        preview: buildPreviewSnippet(content.previewText),
        attachmentsSessionKey,
      },
      recipientsWithKeys,
    );

    return {
      version: 'v3',
      encryptedText: encEmail.encText,
      encryptedPreview: encEmail.encPreview,
      encryptedAttachmentsSessionKey: encEmail.encAttachmentsSessionKey,
      wrappedKeys: encryptedKeys,
    };
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
   * Finds the caller's wrapped key by its `encryptedForEmail` label.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  private findKeyFor(wrappedKeys: WrappedKey[], address: string): WrappedKey {
    const normalized = address.toLowerCase();
    const wrapped = wrappedKeys.find((k) => k.encryptedForEmail?.toLowerCase() === normalized);
    if (!wrapped) {
      throw new EnvelopeDecryptionError();
    }
    return wrapped;
  }

  /**
   * Decrypts the full envelope (body, preview and attachments session key)
   * using the caller's wrapped key.
   */
  private decryptForCaller(envelope: EncryptionBlock, keypair: HybridKeyPair, address: string) {
    const wrapped = this.findKeyFor(envelope.wrappedKeys, address);
    return decryptEmailHybrid(
      {
        encText: envelope.encryptedText,
        encPreview: envelope.encryptedPreview,
        encAttachmentsSessionKey: envelope.encryptedAttachmentsSessionKey,
      },
      wrapped,
      keypair.secretKey,
    );
  }

  /**
   * Decrypts the email body from its envelope using the caller's keypair.
   * @returns the cleartext body.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  async decryptEnvelope(envelope: EncryptionBlock, keypair: HybridKeyPair, address: string): Promise<string> {
    const { text } = await this.decryptForCaller(envelope, keypair, address);
    return text;
  }

  /**
   * Decrypts the list preview snippet from an encrypted summary using the
   * caller's keypair.
   *
   * The summary carries only the preview ciphertext, but the crypto library's
   * decrypt requires every `EmailEncrypted` field to be present. All three
   * ciphertexts share one session key, so the preview ciphertext is passed in
   * every slot and only the decrypted `preview` is read.
   *
   * @returns the cleartext preview snippet.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  async decryptSummaryPreview(summary: EncryptedSummary, keypair: HybridKeyPair, address: string): Promise<string> {
    const wrapped = this.findKeyFor(summary.wrappedKeys, address);
    const { preview } = await decryptEmailHybrid(
      {
        encText: summary.encryptedPreview,
        encPreview: summary.encryptedPreview,
        encAttachmentsSessionKey: summary.encryptedPreview,
      },
      wrapped,
      keypair.secretKey,
    );
    return preview;
  }

  /**
   * Decrypt the body of a given email
   * @param mail - The email to decrypt
   * @returns - An object indicating if the decryption was ok and the decrypted text
   */
  async decryptMailBody(mail: EmailResponse): Promise<DecryptedMailBody> {
    const rawBody = (mail.textBody ?? '') as string;
    const isEncrypted = this.isEncryptedEmailBody(rawBody);

    if (!isEncrypted) {
      const text = mail.htmlBody && mail.htmlBody.length > 0 ? mail.htmlBody : rawBody;
      return { ok: true, text, envelope: null, isEncrypted: false };
    }

    const senderKeys = MailKeysService.instance.getCurrentKeys();
    const senderAddress = MailKeysService.instance.getCurrentAddress();
    if (!senderKeys || !senderAddress) {
      return { ok: false, isEncrypted: true, decryptError: 'No sender keys received', reason: 'no-keys' };
    }

    try {
      const envelope = this.parseEncryptionBlock(rawBody);
      const text = await this.decryptEnvelope(envelope, senderKeys, senderAddress);
      return { ok: true, text, envelope, isEncrypted: true };
    } catch (error) {
      const castedError = ErrorService.instance.castError(error);
      console.error('Failed to decrypt mail body', error);
      return { ok: false, decryptError: castedError.message, isEncrypted: true, reason: 'decrypt-failed' };
    }
  }

  /**
   * Recovers the symmetric session key used to encrypt every attachment in the
   * email. Pair with `decryptSymmetrically` over the downloaded blob bytes.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  async decryptAttachmentsSessionKey(
    envelope: EncryptionBlock,
    keypair: HybridKeyPair,
    address: string,
  ): Promise<Uint8Array> {
    const { attachmentsSessionKey } = await this.decryptForCaller(envelope, keypair, address);
    return attachmentsSessionKey;
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
}
