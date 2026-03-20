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

export const getMockedSubscription = (params?: Partial<UserSubscription>): UserSubscription => {
  switch (params?.type) {
    case 'lifetime': {
      return {
        type: 'lifetime',
        productId: faker.string.uuid(),
        ...(params as Partial<Extract<UserSubscription, { type: 'lifetime' }>>),
      };
    }

    case 'subscription': {
      const subscriptionParams = params as Partial<Extract<UserSubscription, { type: 'subscription' }>>;
      return {
        type: 'subscription',
        subscriptionId: faker.string.uuid(),
        amount: faker.number.int({ min: 100, max: 10000 }),
        currency: 'USD',
        interval: faker.helpers.arrayElement(['year', 'month'] as const),
        nextPayment: faker.date.future().getTime(),
        priceId: faker.string.uuid(),
        productId: faker.string.uuid(),
        amountAfterCoupon: faker.number.int({ min: 0, max: 100 }),
        ...subscriptionParams,
      };
    }

    default: {
      return {
        type: 'free',
      };
    }
  }
};
export const getMockedLoginCredentials = () => {
  return {
    user: getMockedUser(),
    mnemonic: 'test-mnemonic',
    newToken: 'test-token',
  };
};

const createEmailAddress = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatar: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.5 }),
});

export const getMockedMail = () => ({
  id: faker.string.uuid(),
  threadId: faker.string.uuid(),
  from: [createEmailAddress()],
  to: [createEmailAddress()],
  cc: faker.helpers.maybe(() => [createEmailAddress()], { probability: 0.3 }) ?? [],
  bcc: [],
  replyTo: [createEmailAddress()],
  subject: faker.lorem.sentence(),
  receivedAt: faker.date.recent().toISOString(),
  sentAt: faker.date.recent().toISOString(),
  preview: faker.lorem.sentences(2),
  textBody: faker.lorem.paragraphs(2),
  htmlBody: `<p>${faker.lorem.paragraphs(2)}</p>`,
  isRead: faker.datatype.boolean(),
  isFlagged: faker.datatype.boolean(),
  hasAttachment: faker.datatype.boolean(),
  size: faker.number.int({ min: 1024, max: 16384 }),
});

export const getMockedMails = (count = 3) => ({
  emails: Array.from({ length: count }, () => {
    const mail = getMockedMail();
    return {
      id: mail.id,
      threadId: mail.threadId,
      from: mail.from,
      to: mail.to,
      subject: mail.subject,
      receivedAt: mail.receivedAt,
      preview: mail.preview,
      isRead: mail.isRead,
      isFlagged: mail.isFlagged,
      hasAttachment: mail.hasAttachment,
      size: mail.size,
    };
  }),
  total: faker.number.int({ min: count, max: 500 }),
});

export const getMockedMailBoxes = () => [
  {
    id: faker.string.uuid(),
    name: 'Inbox',
    type: 'inbox',
    parentId: null,
    totalEmails: faker.number.int({ min: 50, max: 500 }),
    unreadEmails: faker.number.int({ min: 0, max: 20 }),
  },
  {
    id: faker.string.uuid(),
    name: 'Sent',
    type: 'sent',
    parentId: null,
    totalEmails: faker.number.int({ min: 10, max: 200 }),
    unreadEmails: 0,
  },
  {
    id: faker.string.uuid(),
    name: 'Drafts',
    type: 'drafts',
    parentId: null,
    totalEmails: faker.number.int({ min: 0, max: 20 }),
    unreadEmails: 0,
  },
  {
    id: faker.string.uuid(),
    name: 'Spam',
    type: 'spam',
    parentId: null,
    totalEmails: faker.number.int({ min: 0, max: 50 }),
    unreadEmails: faker.number.int({ min: 0, max: 50 }),
  },
  {
    id: faker.string.uuid(),
    name: 'Trash',
    type: 'trash',
    parentId: null,
    totalEmails: faker.number.int({ min: 0, max: 30 }),
    unreadEmails: 0,
  },
];
