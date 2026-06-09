import { AxiosResponseError, AxiosUnknownError } from '@internxt/sdk/dist/shared/types/errors';
import type { RequestCanceler } from '@internxt/sdk/dist/shared/http/types';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';
import { MailService } from '@/services/sdk/mail';
import { MailEncryptionService } from '../mail-encryption';
import { decryptSymmetrically } from 'internxt-crypto';

const MAX_RETRIES = 2;

export interface UploadOptions {
  onCanceler?: (canceler: RequestCanceler) => void;
  isCancelled?: () => boolean;
}

export class NetworkService {
  public static readonly instance: NetworkService = new NetworkService();

  async upload(sessionKey: Uint8Array, file: File, options: UploadOptions = {}): Promise<UploadAttachmentResponse> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const encryptedFile = await this.encryptFile(sessionKey, file);
      const { promise, requestCanceler } = MailService.instance.uploadAttachment(encryptedFile);
      options.onCanceler?.(requestCanceler);
      try {
        return await promise;
      } catch (error) {
        lastError = error;
        if (options.isCancelled?.()) throw error;
        if (!this.isTransientError(error)) throw error;
      }
    }
    throw lastError;
  }

  async download({
    mailId,
    blobId,
    name,
    type,
    attachmentsSessionKey,
  }: {
    mailId: string;
    blobId: string;
    name: string;
    type: string;
    attachmentsSessionKey: Uint8Array;
  }): Promise<{ blob: Blob; name: string }> {
    const { data, contentType, fileName } = await MailService.instance.downloadAttachment(mailId, blobId, name, type);
    const payload = await decryptSymmetrically(attachmentsSessionKey, new Uint8Array(data));
    const blob = new Blob([payload as BlobPart], { type: contentType || type });
    return { blob, name: name ?? fileName };
  }

  private async encryptFile(sessionKey: Uint8Array, file: File): Promise<File> {
    const { encryptedFile } = await MailEncryptionService.instance.encryptAttachment(sessionKey, file);
    return new File([encryptedFile as BlobPart], file.name, { type: file.type });
  }

  private isTransientError(error: unknown): boolean {
    if (error instanceof AxiosResponseError) return error.status >= 500;
    if (error instanceof AxiosUnknownError) {
      return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ERR_NETWORK';
    }
    return false;
  }
}
