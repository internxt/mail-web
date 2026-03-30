/* eslint-disable react-hooks/set-state-in-effect */
import { DEFAULT_FOLDER_LIMIT } from '@/constants';
import { useGetListFolderQuery } from '@/store/api/mail';
import type { FolderType } from '@/types/mail';
import { useEffect, useState } from 'react';

const useListFolderPaginated = (mailbox: FolderType) => {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    setPosition(0);
  }, [mailbox]);

  const {
    data: listFolder,
    isLoading: isLoadingListFolder,
    isFetching,
  } = useGetListFolderQuery(
    {
      mailbox,
      limit: DEFAULT_FOLDER_LIMIT,
      position,
    },
    {
      pollingInterval: 30000,
      skip: !mailbox,
    },
  );

  const hasMore = (listFolder?.emails.length ?? 0) < (listFolder?.total ?? 0);

  const onLoadMore = () => {
    if (isFetching || !hasMore) return;
    setPosition((prev) => prev + DEFAULT_FOLDER_LIMIT);
  };

  return {
    listFolder,
    isLoadingListFolder,
    onLoadMore,
    hasMore,
  };
};

export default useListFolderPaginated;
