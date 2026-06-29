import { AUTO_POLLING_INTERVAL_IN_MILLISECONDS, DEFAULT_FOLDER_LIMIT } from '@/constants';
import { useGetListFolderQuery } from '@/store/api/mail';
import type { FolderType } from '@/types/mail';
import { useState } from 'react';

const useListFolderPaginated = (mailbox: FolderType) => {
  const [currentMailbox, setCurrentMailbox] = useState(mailbox);
  const [anchorId, setAnchorId] = useState<string | undefined>(undefined);
  const [unreadFilter, setUnreadFilter] = useState<boolean | undefined>(undefined);

  if (currentMailbox !== mailbox) {
    setCurrentMailbox(mailbox);
    setAnchorId(undefined);
    setUnreadFilter(undefined);
  }

  const {
    data: listFolder,
    isLoading: isLoadingListFolder,
    isFetching,
  } = useGetListFolderQuery(
    {
      mailbox,
      limit: DEFAULT_FOLDER_LIMIT,
      anchorId,
      unread: unreadFilter,
    },
    {
      pollingInterval: AUTO_POLLING_INTERVAL_IN_MILLISECONDS,
      skipPollingIfUnfocused: true,
      skip: !mailbox,
    },
  );

  const onLoadMore = () => {
    if (isFetching || !listFolder?.hasMoreMails) return;

    setAnchorId(listFolder?.nextAnchor);
  };

  const applyUnreadFilter = (value: boolean | undefined) => {
    setAnchorId(undefined);
    setUnreadFilter(value);
  };

  const toggleUnreadFilter = () => {
    applyUnreadFilter(unreadFilter === true ? undefined : true);
  };

  const listFolderEmails = listFolder?.emails;

  return {
    listFolderEmails,
    isLoadingListFolder,
    hasMoreEmails: listFolder?.hasMoreMails,
    isUnreadFilter: unreadFilter,
    listEmailsCount: listFolderEmails?.length,
    onLoadMore,
    toggleUnreadFilter,
  };
};

export default useListFolderPaginated;
