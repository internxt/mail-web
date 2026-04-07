import { api } from '../base';
import { FetchMailboxesInfoError, FetchMessageError, FetchListFolderError, UpdateMailError } from '@/errors';
import { ErrorService } from '@/services/error';
import { MailService } from '@/services/sdk/mail';
import type { FolderType } from '@/types/mail';
import type { EmailListResponse, EmailResponse, ListEmailsQuery, MailboxResponse } from '@internxt/sdk';

export const mailApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMailboxesInfo: builder.query<MailboxResponse[], void>({
      async queryFn() {
        try {
          const mailboxes = await MailService.instance.getMailboxesInfo();
          return { data: mailboxes };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchMailboxesInfoError(err.message, err.requestId) };
        }
      },
      providesTags: ['Mailbox'],
    }),
    getListFolder: builder.query<EmailListResponse, ListEmailsQuery>({
      serializeQueryArgs: ({ queryArgs }) => ({ mailbox: queryArgs?.mailbox }),
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
        currentArg?.mailbox !== previousArg?.mailbox || currentArg?.anchorId !== previousArg?.anchorId,
      async queryFn(query) {
        try {
          const mailList = await MailService.instance.listFolder(query);
          return { data: mailList };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new FetchListFolderError(err.message, err.requestId) };
        }
      },
      providesTags: ['ListFolder'],
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
    markAsRead: builder.mutation<null, { emailId: string; mailbox: string }>({
      async queryFn({ emailId }) {
        try {
          await MailService.instance.updateEmailStatus(emailId, { isRead: true });
          return { data: null };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new UpdateMailError(err.message, 'markAsRead', err.requestId) };
        }
      },
      async onQueryStarted({ emailId, mailbox }, { dispatch, queryFulfilled }) {
        let shouldUpdateUnreadCount = false;

        const patchEmailList = dispatch(
          mailApi.util.updateQueryData('getListFolder', { mailbox: mailbox as FolderType }, (draft) => {
            const mail = draft.emails.find((m) => m.id === emailId);
            if (mail && !mail.isRead) {
              mail.isRead = true;
              shouldUpdateUnreadCount = true;
            }
          }),
        );

        if (!shouldUpdateUnreadCount) return;

        const patchMailboxes = dispatch(
          mailApi.util.updateQueryData('getMailboxesInfo', undefined, (draft) => {
            const entry = draft.find((m) => m.type === mailbox);
            if (entry) entry.unreadEmails = Math.max(0, entry.unreadEmails - 1);
          }),
        );

        try {
          await queryFulfilled;
        } catch {
          patchEmailList.undo();
          patchMailboxes.undo();
        }
      },
    }),
  }),
});

export const { useGetMailboxesInfoQuery, useGetListFolderQuery, useGetMailMessageQuery, useMarkAsReadMutation } =
  mailApi;
