import type { UsageResponseV2 } from '@internxt/sdk/dist/drive/storage/types';
import { SdkManager } from '..';

export class StorageService {
  public static readonly instance: StorageService = new StorageService();

  async getUsage(): Promise<UsageResponseV2> {
    const storageClient = SdkManager.instance.getStorage();
    const usage = await storageClient.spaceUsageV2();

    return usage;
  }

  async getLimit(): Promise<number> {
    const storageClient = SdkManager.instance.getStorage();
    const { maxSpaceBytes } = await storageClient.spaceLimitV2();

    return maxSpaceBytes;
  }
}
