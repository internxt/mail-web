import type { RequestCanceler } from '@internxt/sdk/dist/shared/http/types';

export type UploadAttachmentCallbacks = {
  onSuccess: (id: string, blobId: string) => void;
  onError: (id: string, error: unknown) => void;
};

export type UploadHandle = {
  id: string;
  file: File;
};

export type UploadAttachmentTask = {
  id: string;
  file: File;
  callbacks: UploadAttachmentCallbacks;
  cancelled: boolean;
  failed: boolean;
  canceler?: RequestCanceler;
};
