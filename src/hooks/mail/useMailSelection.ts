import { useState } from 'react';
import type { EmailListResponse } from '@internxt/sdk';

export const useMailSelection = (emails: EmailListResponse['emails'] | undefined) => {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const selectAll = () => {
    setSelectedEmails(emails?.map((email) => email.id) ?? []);
  };

  const selectNone = () => setSelectedEmails([]);

  const selectRead = () => {
    setSelectedEmails(emails?.filter((email) => email.isRead).map((email) => email.id) ?? []);
  };

  const selectUnread = () => {
    const unreadEmails = emails?.filter((email) => !email.isRead);
    const unreadEmailsIds = unreadEmails?.map((email) => email.id);
    setSelectedEmails(unreadEmailsIds ?? []);
  };

  const toggleSelectAll = () => {
    if (selectedEmails.length === emails?.length) {
      selectNone();
    } else {
      selectAll();
    }
  };

  return {
    selectedEmails,
    selectAll,
    selectNone,
    selectRead,
    selectUnread,
    toggleSelectAll,
  };
};
