import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import { useGetListFolderQuery } from '@/store/api/mail';
import type { FolderType } from '@/types/mail';
import { useState } from 'react';

const useListFolderPaginated = (mailbox: FolderType) => {
  const [anchorId, setAnchorId] = useState<string | undefined>(undefined);

  const {
    data: listFolder,
    isLoading: isLoadingListFolder,
    isFetching,
  } = useGetListFolderQuery(
    {
      mailbox,
      limit: DEFAULT_FOLDER_LIMIT,
      anchorId,
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

  return {
    listFolderEmails: listFolder?.emails,
    isLoadingListFolder,
    onLoadMore,
    hasMoreEmails: listFolder?.hasMoreMails,
  };
};

export default useListFolderPaginated;
