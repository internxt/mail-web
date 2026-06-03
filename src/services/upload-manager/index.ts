import { queue, type QueueObject } from 'async';
import { AxiosResponseError, AxiosUnknownError } from '@internxt/sdk/dist/shared/types/errors';
import { MailService } from '@/services/sdk/mail';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';
import type { UploadAttachmentCallbacks, UploadAttachmentTask, UploadHandle } from '@/types/mail/upload-manager';

const UPLOAD_CONCURRENCY = 4;
const MAX_RETRIES = 2;
const CANCEL_REASON = 'Upload cancelled';

export class UploadManager {
  public static readonly instance: UploadManager = new UploadManager();

  private readonly uploadFilesTasks: QueueObject<UploadAttachmentTask>;
  private readonly tasks: Map<string, UploadAttachmentTask> = new Map();

  private constructor() {
    this.uploadFilesTasks = queue<UploadAttachmentTask>(this.uploadFileTask, UPLOAD_CONCURRENCY);
  }

  private readonly uploadFileTask = async (task: UploadAttachmentTask) => {
    if (task.cancelled) return;
    try {
      const result = await this.uploadWithRetries(task);
      if (task.cancelled) return;
      task.callbacks.onSuccess(task.id, result);
      if (this.tasks.get(task.id) === task) this.tasks.delete(task.id);
    } catch (error) {
      if (task.cancelled) return;
      task.failed = true;
      task.callbacks.onError(task.id, error);
    }
  };

  /**
   * Starts the upload of the given files
   * @param files - The files to upload
   * @param callbacks - The callbacks to call when the upload is complete (success or error)
   * @returns The uploaded ID and the file object
   */
  run(files: File[], callbacks: UploadAttachmentCallbacks): UploadHandle[] {
    return files.map((file) => {
      const id = crypto.randomUUID();
      this.enqueueTask(id, file, callbacks);
      return { id, file };
    });
  }

  /**
   * The retry method is used to restart an upload that has failed
   * @param id - The ID of the upload task
   * @param callbacks - The callbacks to call when the upload is complete (success or error)
   * @returns - void
   */
  retry(id: string, callbacks: UploadAttachmentCallbacks): void {
    const existing = this.tasks.get(id);
    if (!existing) return;
    this.cancelTask(existing);
    this.enqueueTask(id, existing.file, callbacks);
  }

  /**
   * The remove method is used to cancel an upload
   * @param id - The ID of the upload task
   * @returns - void
   */
  remove(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    this.cancelTask(task);
    this.tasks.delete(id);
  }

  private cancelTask(task: UploadAttachmentTask): void {
    task.cancelled = true;
    task.canceler?.cancel(CANCEL_REASON);
    task.canceler = undefined;
  }

  private enqueueTask(id: string, file: File, callbacks: UploadAttachmentCallbacks): void {
    const task: UploadAttachmentTask = { id, file, callbacks, cancelled: false, failed: false };
    this.tasks.set(id, task);
    void this.uploadFilesTasks.push(task);
  }

  private async uploadWithRetries(task: UploadAttachmentTask): Promise<UploadAttachmentResponse> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { promise, requestCanceler } = MailService.instance.uploadAttachment(task.file);
      task.canceler = requestCanceler;
      try {
        return await promise;
      } catch (error) {
        lastError = error;
        if (task.cancelled) throw error;
        if (!isTransientError(error)) throw error;
      } finally {
        task.canceler = undefined;
      }
    }
    throw lastError;
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof AxiosResponseError) return error.status >= 500;
  if (error instanceof AxiosUnknownError) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ERR_NETWORK';
  }
  return false;
}
