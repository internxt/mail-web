/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoginCredentials } from '@/types/oauth';
import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import type { UserSubscription } from '@internxt/sdk/dist/drive/payments/types/types';
import type { AppSumoDetails } from '@internxt/sdk/dist/shared/types/appsumo';
import { faker } from '@faker-js/faker';

export const getMockedUser = (params?: Partial<LoginCredentials['user']>): LoginCredentials['user'] => {
  return {
    hasReferralsProgram: false,
    privateKey: faker.string.alphanumeric(64),
    publicKey: faker.string.alphanumeric(64),
    registerCompleted: false,
    revocationKey: faker.string.uuid(),
    root_folder_id: faker.number.int({ min: 100000, max: 999999999 }),
    rootFolderUuid: faker.string.uuid(),
    userId: faker.string.uuid(),
    uuid: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.firstName(),
    lastname: faker.person.lastName(),
    username: faker.internet.username(),
    bridgeUser: faker.internet.email(),
    bucket: faker.string.alphanumeric(24),
    rootFolderId: faker.string.uuid(),
    mnemonic: faker.lorem.words(12),
    createdAt: faker.date.past(),
    avatar: faker.image.avatar(),
    emailVerified: true,
    sharedWorkspace: false,
    appSumoDetails: {} as AppSumoDetails,
    backupsBucket: faker.string.alphanumeric(24),
    credit: 0,
    keys: {
      ecc: {
        privateKey: faker.string.alphanumeric(64),
        publicKey: faker.string.alphanumeric(64),
      },
      kyber: {
        privateKey: faker.string.alphanumeric(64),
        publicKey: faker.string.alphanumeric(64),
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
        featureId: faker.string.uuid(),
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
