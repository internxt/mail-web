/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginCredentials } from '@/types/oauth';
import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import type { UserSubscription } from '@internxt/sdk/dist/drive/payments/types/types';
import type { AppSumoDetails } from '@internxt/sdk/dist/shared/types/appsumo';
import crypto from 'node:crypto';

export const getMockedUser = (params?: Partial<LoginCredentials['user']>): LoginCredentials['user'] => {
  return {
    hasReferralsProgram: false,
    privateKey: crypto.randomBytes(16).toString('hex'),
    publicKey: crypto.randomBytes(16).toString('hex'),
    registerCompleted: false,
    revocationKey: crypto.randomBytes(16).toString('hex'),
    root_folder_id: 123456789,
    rootFolderUuid: crypto.randomBytes(16).toString('hex'),
    userId: crypto.randomBytes(16).toString('hex'),
    uuid: crypto.randomBytes(16).toString('hex'),
    email: crypto.randomBytes(16).toString('hex'),
    name: crypto.randomBytes(16).toString('hex'),
    lastname: crypto.randomBytes(16).toString('hex'),
    username: crypto.randomBytes(16).toString('hex'),
    bridgeUser: crypto.randomBytes(16).toString('hex'),
    bucket: crypto.randomBytes(16).toString('hex'),
    rootFolderId: crypto.randomBytes(16).toString('hex'),
    mnemonic: crypto.randomBytes(16).toString('hex'),
    createdAt: new Date(),
    avatar: crypto.randomBytes(16).toString('hex'),
    emailVerified: true,
    sharedWorkspace: false,
    appSumoDetails: {} as AppSumoDetails,
    backupsBucket: crypto.randomBytes(16).toString('hex'),
    credit: 0,
    keys: {
      ecc: {
        privateKey: crypto.randomBytes(16).toString('hex'),
        publicKey: crypto.randomBytes(16).toString('hex'),
      },
      kyber: {
        privateKey: crypto.randomBytes(16).toString('hex'),
        publicKey: crypto.randomBytes(16).toString('hex'),
      },
    },
    ...params,
  };
};

export const getMockedTier = (params?: Partial<Tier>): Tier => {
  return {
    id: 'tier-1',
    billingType: 'subscription',
    productId: 'product-id',
    label: 'Free',
    featuresPerService: {
      antivirus: {
        enabled: true,
      },
      backups: {
        enabled: true,
      },
      cleaner: {
        enabled: true,
      },
      darkMonitor: {
        enabled: true,
      },
      vpn: {
        enabled: true,
        featureId: crypto.randomBytes(16).toString('hex'),
      },
      drive: {
        enabled: true,
        maxSpaceBytes: 1000000000,
        passwordProtectedSharing: {
          enabled: true,
        },
        restrictedItemsSharing: {
          enabled: true,
        },
        workspaces: {
          enabled: false,
        } as any,
      },
      mail: {
        enabled: true,
        addressesPerUser: 5,
      },
      meet: {
        enabled: true,
        paxPerCall: 10,
      },
    },
    ...params,
  };
};

export const getMockedSubscription = (params?: UserSubscription): UserSubscription => {
  return {
    type: 'free',
    ...params,
  };
};
export const getMockedLoginCredentials = () => {
  return {
    user: getMockedUser(),
    mnemonic: 'test-mnemonic',
    newToken: 'test-token',
  };
};
