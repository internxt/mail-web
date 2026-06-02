import { queue, type QueueObject } from 'async';
import { MailService } from '@/services/sdk/mail';
import type { UploadAttachmentResponse } from '@internxt/sdk/dist/mail/types';

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
};

const UPLOAD_CONCURRENCY = 4;
const MAX_RETRIES = 2;

export class UploadManager {
  public static readonly instance: UploadManager = new UploadManager();

  private readonly uploadFiles: QueueObject<UploadAttachmentTask>;
  private readonly tasks: Map<string, UploadAttachmentTask> = new Map();

  private constructor() {
    this.uploadFiles = queue<UploadAttachmentTask>(async (task) => {
      if (task.cancelled) return;
      try {
        const result = await this.uploadWithRetries(task.file);
        if (!task.cancelled) task.callbacks.onSuccess(task.id, result);
      } catch (error) {
        if (!task.cancelled) task.callbacks.onError(task.id, error);
      } finally {
        if (this.tasks.get(task.id) === task) this.tasks.delete(task.id);
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
    existing.cancelled = true;
    this.enqueue(id, existing.file, callbacks);
  }

  remove(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.cancelled = true;
    this.tasks.delete(id);
  }

  private enqueue(id: string, file: File, callbacks: UploadAttachmentCallbacks): void {
    const task: UploadAttachmentTask = { id, file, callbacks, cancelled: false };
    this.tasks.set(id, task);
    void this.uploadFiles.push(task);
  }

  private async uploadWithRetries(file: File): Promise<UploadAttachmentResponse> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await MailService.instance.uploadAttachment(file);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}
