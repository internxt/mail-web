import { api } from '../base';
import {
  FetchMailboxesInfoError,
  FetchMessageError,
  FetchListFolderError,
  UpdateMailError,
  DeleteEmailError,
} from '@/errors';
import { ErrorService } from '@/services/error';
import { MailService } from '@/services/sdk/mail';
import type { FolderType } from '@/types/mail';
import { batchProcess } from '@/utils/batch-processes';
import type { EmailListResponse, EmailResponse, ListEmailsQuery, MailboxResponse } from '@internxt/sdk';
import type { AppDispatch } from '@/store';

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
  }),
});

export const {
  useGetMailboxesInfoQuery,
  useGetListFolderQuery,
  useGetMailMessageQuery,
  useUpdateReadStatusMutation,
  useDeleteMailsMutation,
  useMoveToFolderMutation,
} = mailApi;
