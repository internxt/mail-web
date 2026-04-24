import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import { useGetListFolderQuery } from '@/store/api/mail';
import type { FolderType } from '@/types/mail';
import { useState } from 'react';

const useListFolderPaginated = (mailbox: FolderType) => {
  const [anchorId, setAnchorId] = useState<string | undefined>(undefined);
  const [unreadFilter, setUnreadFilter] = useState<boolean | undefined>(undefined);

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
      pollingInterval: 30000,
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

  return {
    listFolderEmails: listFolder?.emails,
    isLoadingListFolder,
    onLoadMore,
    hasMoreEmails: listFolder?.hasMoreMails,
    isUnreadFilter: unreadFilter,
    toggleUnreadFilter,
    applyUnreadFilter,
  };
};

export default useListFolderPaginated;
