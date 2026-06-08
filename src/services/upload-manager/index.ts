import { queue, type QueueObject } from 'async';
import type { RequestCanceler } from '@internxt/sdk/dist/shared/http/types';
import { NetworkService } from '../network';

const UPLOAD_CONCURRENCY = 4;
const CANCEL_REASON = 'Upload cancelled';

export interface UploadManagerCallbacks {
  onSuccess: (id: string, blobId: string) => void;
  onError: (id: string, error: unknown) => void;
}

interface UploadJob {
  id: string;
  file: File;
  canceler?: RequestCanceler;
  cancelled: boolean;
}

export class UploadManager {
  private readonly jobs: Map<string, UploadJob> = new Map();
  private readonly q: QueueObject<UploadJob>;

  constructor(
    private readonly sessionKey: Uint8Array,
    private readonly callbacks: UploadManagerCallbacks,
  ) {
    this.q = queue<UploadJob>(this.process, UPLOAD_CONCURRENCY);
  }

  enqueue(id: string, file: File): void {
    const job: UploadJob = { id, file, cancelled: false };
    this.jobs.set(id, job);
    void this.q.push(job);
  }

  retry(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.cancelled = false;
    job.canceler = undefined;
    void this.q.push(job);
  }

  cancel(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.cancelled = true;
    job.canceler?.cancel(CANCEL_REASON);
    job.canceler = undefined;
    this.jobs.delete(id);
  }

  clear(): void {
    this.jobs.forEach((job) => {
      job.cancelled = true;
      job.canceler?.cancel(CANCEL_REASON);
    });
    this.jobs.clear();
    this.q.remove(() => true);
  }

  private readonly process = async (job: UploadJob): Promise<void> => {
    if (job.cancelled) return;
    try {
      const result = await NetworkService.instance.upload(this.sessionKey, job.file, {
        onCanceler: (canceler) => {
          job.canceler = canceler;
        },
        isCancelled: () => job.cancelled,
      });
      job.canceler = undefined;
      if (job.cancelled) return;
      this.callbacks.onSuccess(job.id, result.blobId);
    } catch (error) {
      job.canceler = undefined;
      if (job.cancelled) return;
      this.callbacks.onError(job.id, error);
    }
  };
}
