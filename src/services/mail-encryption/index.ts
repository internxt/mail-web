import { base64ToUint8Array, uint8ArrayToBase64, encryptSymmetrically, type HybridKeyPair } from 'internxt-crypto';
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

type EncryptedBodyPayload = { body: string; attachmentsSessionKey: string };

const PREVIEW_PLAINTEXT_LENGTH = 256;

export const ENCRYPTED_EMAIL_PREFIX = 'INTERNXT-ENCRYPTED-EMAIL-v1';

function buildPreviewSnippet(previewText: string): string {
  return previewText.replace(/\s+/g, ' ').trim().slice(0, PREVIEW_PLAINTEXT_LENGTH);
}

export class MailEncryptionService {
  public static readonly instance: MailEncryptionService = new MailEncryptionService();

  private constructor() {}

  /**
   * Only the body and preview are encrypted; the subject travels as cleartext so
   * the backend can index it.
   *
   * Every wrapped key is labeled with the recipient address it was encrypted
   * for (`encryptedForEmail`), so each recipient finds their entry with a
   * direct lookup — no trial decryption. Because the labels expose the full
   * recipient set to anyone holding the envelope, Bcc recipients must not be
   * part of an encrypted send (compose enforces this).
   *
   * The body payload carries the attachments session key inside the ciphertext,
   * so one wrapped key per recipient covers the body and every attachment. The
   * preview snippet is sealed separately (`previewWrappedKeys`) so list
   * summaries can travel without the full body ciphertext.
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

    const payload: EncryptedBodyPayload = {
      body: content.body,
      attachmentsSessionKey: uint8ArrayToBase64(attachmentsSessionKey),
    };

    const [encryptedBodies, encryptedPreviews] = await Promise.all([
      encryptEmailHybridForMultipleRecipients({ text: JSON.stringify(payload) }, recipientsWithKeys),
      encryptEmailHybridForMultipleRecipients(
        { text: buildPreviewSnippet(content.previewText) || ' ' },
        recipientsWithKeys,
      ),
    ]);

    return {
      version: 'v2',
      encryptedText: encryptedBodies[0].encEmail.encText,
      wrappedKeys: encryptedBodies.map((e) => e.encryptedKey),
      encryptedPreview: encryptedPreviews[0].encEmail.encText,
      previewWrappedKeys: encryptedPreviews.map((e) => e.encryptedKey),
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
   * Finds the caller's wrapped key by its `encryptedForEmail` label and
   * decrypts a ciphertext sealed with the shared session key.
   *
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  private async decryptForCaller(
    wrappedKeys: WrappedKey[],
    ciphertextB64: string,
    keypair: HybridKeyPair,
    address: string,
  ): Promise<string> {
    const normalized = address.toLowerCase();
    const wrapped = wrappedKeys.find((k) => k.encryptedForEmail?.toLowerCase() === normalized);
    if (!wrapped) {
      throw new EnvelopeDecryptionError();
    }
    const { text } = await decryptEmailHybrid(
      { encryptedKey: wrapped, encEmail: { encText: ciphertextB64 } },
      keypair.secretKey,
    );
    return text;
  }

  private parseBodyPayload(text: string): EncryptedBodyPayload {
    return JSON.parse(text) as EncryptedBodyPayload;
  }

  /**
   * Decrypts the email body from its envelope using the caller's keypair.
   * @returns the cleartext body.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  async decryptEnvelope(envelope: EncryptionBlock, keypair: HybridKeyPair, address: string): Promise<string> {
    const text = await this.decryptForCaller(envelope.wrappedKeys, envelope.encryptedText, keypair, address);
    return this.parseBodyPayload(text).body;
  }

  /**
   * Decrypts the list preview snippet from an encrypted summary using the caller's keypair.
   * @returns the cleartext preview snippet.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  decryptSummaryPreview(summary: EncryptedSummary, keypair: HybridKeyPair, address: string): Promise<string> {
    return this.decryptForCaller(summary.wrappedKeys, summary.encryptedPreview, keypair, address);
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
   * email. It travels inside the encrypted body payload, so this decrypts the
   * body and extracts it. Pair with `decryptSymmetrically` over the downloaded
   * blob bytes.
   * @throws {EnvelopeDecryptionError} if no wrapped key is labeled for the caller.
   */
  async decryptAttachmentsSessionKey(
    envelope: EncryptionBlock,
    keypair: HybridKeyPair,
    address: string,
  ): Promise<Uint8Array> {
    const text = await this.decryptForCaller(envelope.wrappedKeys, envelope.encryptedText, keypair, address);
    const { attachmentsSessionKey } = this.parseBodyPayload(text);
    if (!attachmentsSessionKey) {
      throw new EnvelopeDecryptionError();
    }
    return base64ToUint8Array(attachmentsSessionKey);
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
