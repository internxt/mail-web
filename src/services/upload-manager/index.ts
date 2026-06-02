import { queue, type QueueObject } from 'async';
import { MailService } from '@/services/sdk/mail';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';
import type { RequestCanceler } from '@internxt/sdk/dist/shared/http/client';

export type UploadAttachmentCallbacks = {
  onSuccess: (id: string, result: UploadAttachmentResponse) => void;
  onError: (id: string, error: unknown) => void;
};

export type UploadHandle = {
  id: string;
  file: File;
};

type UploadAttachmentTask = {
  id: string;
  file: File;
  callbacks: UploadAttachmentCallbacks;
  cancelled: boolean;
  failed: boolean;
  canceler?: RequestCanceler;
};

const UPLOAD_CONCURRENCY = 4;
const MAX_RETRIES = 2;
const CANCEL_REASON = 'Upload cancelled';

export class UploadManager {
  public static readonly instance: UploadManager = new UploadManager();

  private readonly uploadFiles: QueueObject<UploadAttachmentTask>;
  private readonly tasks: Map<string, UploadAttachmentTask> = new Map();

  private constructor() {
    this.uploadFiles = queue<UploadAttachmentTask>(async (task) => {
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
    }, UPLOAD_CONCURRENCY);
  }

  run(files: File[], callbacks: UploadAttachmentCallbacks): UploadHandle[] {
    return files.map((file) => {
      const id = crypto.randomUUID();
      this.enqueue(id, file, callbacks);
      return { id, file };
    });
  }

  retry(id: string, callbacks: UploadAttachmentCallbacks): void {
    const existing = this.tasks.get(id);
    if (!existing) return;
    this.cancelTask(existing);
    this.enqueue(id, existing.file, callbacks);
  }

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

  private enqueue(id: string, file: File, callbacks: UploadAttachmentCallbacks): void {
    const task: UploadAttachmentTask = { id, file, callbacks, cancelled: false, failed: false };
    this.tasks.set(id, task);
    void this.uploadFiles.push(task);
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
      } finally {
        task.canceler = undefined;
      }
    }
    throw lastError;
  }
}
