import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { FetchMailboxesInfoError, FetchMessageError, FetchListFolderError, UpdateMailError } from '@/errors';
import { ErrorService } from '@/services/error';
import { MailService } from '@/services/sdk/mail';
import type { EmailListResponse, EmailResponse, ListEmailsQuery, MailboxResponse } from '@internxt/sdk';

export const mailQuery = createApi({
  reducerPath: 'mailQuery',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Mailbox', 'ListFolder', 'MailMessage'],

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
    markAsRead: builder.mutation<null, { emailId: string; query: ListEmailsQuery }>({
      async queryFn({ emailId }) {
        try {
          await MailService.instance.updateEmailStatus(emailId, { isRead: true });
          return { data: null };
        } catch (error) {
          const err = ErrorService.instance.castError(error);
          return { error: new UpdateMailError(err.message, 'markAsRead', err.requestId) };
        }
      },
      async onQueryStarted({ emailId, query }, { dispatch, queryFulfilled }) {
        const patchEmailList = dispatch(
          mailQuery.util.updateQueryData('getListFolder', query, (draft) => {
            const mail = draft.emails.find((m) => m.id === emailId);
            if (mail && !mail.isRead) {
              mail.isRead = true;
            }
          }),
        );

        const patchMailboxes = dispatch(
          mailQuery.util.updateQueryData('getMailboxesInfo', undefined, (draft) => {
            const entry = draft.find((m) => m.type === query?.mailbox);
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
  mailQuery;
