import { api } from '../base';
import {
  DeleteEmailError,
  DraftMessageError,
  FetchActiveDomainsError,
  FetchListFolderError,
  FetchMailAccountKeysError,
  FetchMailboxesInfoError,
  FetchMailMeError,
  FetchMessageError,
  FetchRecipientKeysError,
  MAIL_NOT_SETUP_CODE,
  MailNotSetupError,
  SendEmailError,
  UpdateMailError,
} from '@/errors';
import { ErrorService } from '@/services/error';
import { RecipientKeysService } from '@/services/recipient-keys';
import { MailService, type MailMeResponse } from '@/services/sdk/mail';
import type { DecryptedMail, FolderType } from '@/types/mail';
import { batchProcess } from '@/utils/batch-processes';
import type {
  DraftEmailRequest,
  EmailCreatedResponse,
  EmailDomainsResponse,
  EmailListResponse,
  EmailResponse,
  ListEmailsQuery,
  LookupRecipientKeysResponse,
  MailAccountKeysResponse,
  MailboxResponse,
  RecipientKey,
  SendEmailRequest,
} from '@internxt/sdk/dist/mail/types';
import type { AppDispatch } from '@/store';
import { MailEncryptionService } from '@/services/mail-encryption';

const normalizeLookupAddresses = (addresses: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of addresses) {
    const normalized = raw.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out.sort((a, b) => a.localeCompare(b));
};

const patchMailsAfterAction = async ({
  dispatch,
  sourceMailbox,
  emailIds,
  queryFulfilled,
  onSuccess,
}: {
  dispatch: AppDispatch;
  sourceMailbox: FolderType;
  emailIds: string[];
  queryFulfilled: Promise<unknown>;
  onSuccess?: () => void;
}) => {
  let unreadCount = 0;

  const patchEmailList = dispatch(
    mailApi.util.updateQueryData('getListFolder', { mailbox: sourceMailbox }, (draft) => {
      unreadCount = draft.emails.filter((m) => emailIds.includes(m.id) && !m.isRead).length;
      draft.emails = draft.emails.filter((m) => !emailIds.includes(m.id));
    }),
  );
  const patchMailbox = dispatch(
    mailApi.util.updateQueryData('getMailboxesInfo', undefined, (draft) => {
      const entry = draft.find((m) => m.type === sourceMailbox);
      if (entry) entry.unreadEmails = Math.max(0, entry.unreadEmails - unreadCount);
    }),
  );
  try {
    await queryFulfilled;
    onSuccess?.();
  } catch {
    patchEmailList.undo();
    patchMailbox.undo();
  }
};

export const mailApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMailAccountKeys: builder.query<MailAccountKeysResponse, { address?: string } | void>({
      async queryFn(
        arg,
      ): Promise<{ data: MailAccountKeysResponse } | { error: MailNotSetupError | FetchMailAccountKeysError }> {
        try {
          const keys = await MailService.instance.getMailAccountKeys(arg?.address);
          return { data: keys };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          if (err.status === 403 && err.code === MAIL_NOT_SETUP_CODE) {
            return { error: new MailNotSetupError(err.requestId) };
          }
          return { error: new FetchMailAccountKeysError(err.message, err.requestId) };
        }
      },
      providesTags: ['MailAccountKeys'],
    }),
    getMailMe: builder.query<MailMeResponse, void>({
      async queryFn(): Promise<{ data: MailMeResponse } | { error: FetchMailMeError }> {
        try {
          const me = await MailService.instance.getMe();
          return { data: me };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchMailMeError(err.message, err.requestId) };
        }
      },
      providesTags: ['MailMe'],
    }),
    getMailboxesInfo: builder.query<MailboxResponse[], void>({
      async queryFn(): Promise<{ data: MailboxResponse[] } | { error: FetchMailboxesInfoError }> {
        try {
          const mailboxes: MailboxResponse[] = await MailService.instance.getMailboxesInfo();
          return { data: mailboxes };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchMailboxesInfoError(err.message, err.requestId) };
        }
      },
      providesTags: ['Mailbox'],
    }),
    getListFolder: builder.query<EmailListResponse, ListEmailsQuery>({
      serializeQueryArgs: ({ queryArgs }) => ({ mailbox: queryArgs?.mailbox, unread: queryArgs?.unread }),
      merge: (currentCache, newItems, { arg }) => {
        // No anchorId means first page — replace instead of accumulate
        if (arg?.anchorId) {
          currentCache.emails.push(...newItems.emails);
        } else {
          currentCache.emails = newItems.emails;
        }
        currentCache.hasMoreMails = newItems.hasMoreMails;
        currentCache.nextAnchor = newItems.nextAnchor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.mailbox !== previousArg?.mailbox ||
        currentArg?.anchorId !== previousArg?.anchorId ||
        currentArg?.unread !== previousArg?.unread,
      async queryFn(query) {
        try {
          const mailList = await MailService.instance.listFolder(query);
          return { data: mailList };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchListFolderError(err.message, err.requestId) };
        }
      },
      providesTags: (_, __, arg) => [{ type: 'ListFolder', id: arg?.mailbox }],
    }),
    getMailMessage: builder.query<EmailResponse, { emailId: string }>({
      async queryFn({ emailId }) {
        try {
          const mailList = await MailService.instance.getMessage(emailId);
          return { data: mailList };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchMessageError(err.message, err.requestId) };
        }
      },
      providesTags: ['MailMessage'],
    }),

    getThread: builder.query<DecryptedMail[], { emailId: string }>({
      async queryFn({ emailId }) {
        try {
          const mailList = await MailService.instance.getThreads(emailId);
          const decrypted = await Promise.all(
            mailList.map(async (email): Promise<DecryptedMail> => {
              const result = await MailEncryptionService.instance.decryptMailBody(email);
              if (!result.ok) {
                return {
                  ...email,
                  isEncrypted: result.isEncrypted,
                  decryptError: result.decryptError,
                };
              }
              return {
                ...email,
                htmlBody: result.text,
                ...(result.envelope ? { encryption: result.envelope } : {}),
                isEncrypted: result.isEncrypted,
              };
            }),
          );
          return { data: decrypted };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchMessageError(err.message, err.requestId) };
        }
      },
      providesTags: (_, __, arg) => [{ type: 'ThreadMessage', id: arg.emailId }],
    }),
    updateReadStatus: builder.mutation<null, { emailId: string; mailbox: string; isRead: boolean }>({
      async queryFn({ emailId, isRead }) {
        try {
          await MailService.instance.updateEmailStatus(emailId, { isRead });
          return { data: null };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new UpdateMailError(err.message, 'markAsRead', err.requestId) };
        }
      },
      async onQueryStarted({ emailId, mailbox, isRead }, { dispatch, queryFulfilled }) {
        let shouldUpdateUnreadCount = false;

        const patchEmailList = dispatch(
          mailApi.util.updateQueryData('getListFolder', { mailbox: mailbox as FolderType }, (draft) => {
            const mail = draft.emails.find((m) => m.id === emailId);
            if (mail && mail.isRead !== isRead) {
              mail.isRead = isRead;
              shouldUpdateUnreadCount = true;
            }
          }),
        );

        if (!shouldUpdateUnreadCount) return;

        const patchMailboxes = dispatch(
          mailApi.util.updateQueryData('getMailboxesInfo', undefined, (draft) => {
            const entry = draft.find((m) => m.type === mailbox);
            if (entry) {
              const op = isRead ? entry.unreadEmails - 1 : entry.unreadEmails + 1;
              entry.unreadEmails = Math.max(0, op);
            }
          }),
        );

        try {
          await queryFulfilled;
          dispatch(mailApi.util.invalidateTags([{ type: 'ListFolder', id: mailbox }]));
        } catch {
          patchEmailList.undo();
          patchMailboxes.undo();
        }
      },
    }),
    moveToFolder: builder.mutation<null, { emailIds: string[]; sourceMailbox: FolderType; targetMailbox: FolderType }>({
      async queryFn({ emailIds, targetMailbox }) {
        try {
          await batchProcess(emailIds, (id) => MailService.instance.updateEmailStatus(id, { mailbox: targetMailbox }));
          return { data: null };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new UpdateMailError(err.message, 'moveToFolder', err.requestId) };
        }
      },
      async onQueryStarted({ emailIds, sourceMailbox, targetMailbox }, { dispatch, queryFulfilled }) {
        await patchMailsAfterAction({
          emailIds,
          queryFulfilled,
          sourceMailbox,
          dispatch,
          onSuccess: () => dispatch(mailApi.util.invalidateTags([{ type: 'ListFolder', id: targetMailbox }])),
        });
      },
    }),
    deleteMails: builder.mutation<null, { emailIds: string[]; sourceMailbox: FolderType }>({
      async queryFn({ emailIds }) {
        try {
          await batchProcess(emailIds, (id) => MailService.instance.trashEmail(id));
          return { data: null };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new DeleteEmailError(err.message, err.requestId) };
        }
      },

      async onQueryStarted({ emailIds, sourceMailbox }, { dispatch, queryFulfilled }) {
        await patchMailsAfterAction({
          emailIds,
          queryFulfilled,
          sourceMailbox,
          dispatch,
        });
      },
    }),
    getActiveDomains: builder.query<EmailDomainsResponse, void>({
      async queryFn(): Promise<{ data: EmailDomainsResponse } | { error: FetchActiveDomainsError }> {
        try {
          const domains = await MailService.instance.getActiveDomains();
          return { data: domains };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchActiveDomainsError(err.message, err.requestId) };
        }
      },
      providesTags: ['ActiveDomains'],
    }),
    lookupRecipientKeys: builder.query<RecipientKey[], { addresses: string[] }>({
      serializeQueryArgs: ({ queryArgs }) => ({
        addresses: normalizeLookupAddresses(queryArgs.addresses).join(','),
      }),
      async queryFn({ addresses }): Promise<{ data: RecipientKey[] } | { error: FetchRecipientKeysError }> {
        const normalized = normalizeLookupAddresses(addresses);
        if (normalized.length === 0) return { data: [] };
        try {
          const res: LookupRecipientKeysResponse = await MailService.instance.lookupRecipientKeys(normalized);
          for (const r of res.recipients) {
            RecipientKeysService.instance.set(r.address, r.publicKey);
          }
          return { data: res.recipients };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchRecipientKeysError(err.message, err.requestId) };
        }
      },
      providesTags: ['RecipientKeys'],
    }),
    sendEmail: builder.mutation<EmailCreatedResponse, SendEmailRequest>({
      async queryFn(payload): Promise<{ data: EmailCreatedResponse } | { error: SendEmailError }> {
        try {
          const result = await MailService.instance.sendEmail(payload);
          return { data: result };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new SendEmailError(err.message, err.requestId) };
        }
      },
      invalidatesTags: () => [
        { type: 'ListFolder', id: 'inbox' },
        { type: 'ListFolder', id: 'sent' },
        { type: 'ListFolder', id: 'drafts' },
      ],
    }),
    draftEmail: builder.mutation<EmailResponse, DraftEmailRequest>({
      async queryFn(payload): Promise<{ data: EmailResponse } | { error: DraftMessageError }> {
        try {
          const result = await MailService.instance.draftEmail(payload);
          return { data: result };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new DraftMessageError(err.message, err.requestId) };
        }
      },
      invalidatesTags: [{ type: 'ListFolder', id: 'drafts' }],
    }),
    updateDraft: builder.mutation<EmailResponse, { draftId: string; payload: DraftEmailRequest }>({
      async queryFn({ draftId, payload }): Promise<{ data: EmailResponse } | { error: DraftMessageError }> {
        try {
          const updatedDraft = await MailService.instance.updateDraft(draftId, payload);
          return { data: updatedDraft };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new DraftMessageError(err.message, err.requestId) };
        }
      },
      invalidatesTags: [{ type: 'ListFolder', id: 'drafts' }],
    }),
    discardDraft: builder.mutation<void, { draftId: string }>({
      async queryFn({ draftId }): Promise<{ data: void } | { error: DraftMessageError }> {
        try {
          await MailService.instance.discardDraft(draftId);
          return { data: undefined };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new DraftMessageError(err.message, err.requestId) };
        }
      },
      async onQueryStarted({ draftId }, { dispatch, queryFulfilled }) {
        await patchMailsAfterAction({
          emailIds: [draftId],
          queryFulfilled,
          sourceMailbox: 'drafts',
          dispatch,
        });
      },
      invalidatesTags: [{ type: 'ListFolder', id: 'drafts' }],
    }),
  }),
});

export const {
  useGetMailAccountKeysQuery,
  useGetMailMeQuery,
  useGetMailboxesInfoQuery,
  useGetListFolderQuery,
  useGetMailMessageQuery,
  useGetThreadQuery,
  useLazyGetThreadQuery,
  useUpdateReadStatusMutation,
  useDeleteMailsMutation,
  useMoveToFolderMutation,
  useGetActiveDomainsQuery,
  useLookupRecipientKeysQuery,
  useLazyLookupRecipientKeysQuery,
  useSendEmailMutation,
  useDraftEmailMutation,
  useUpdateDraftMutation,
  useDiscardDraftMutation,
} = mailApi;
