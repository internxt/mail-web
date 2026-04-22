import { useGetEmailSearchQuery } from '@/store/api/mail';
import { useState } from 'react';
import type { SearchFiltersQuery } from '@internxt/sdk';

const DEFAULT_LIMIT = 25;

export const useEmailSearch = (filters: Omit<SearchFiltersQuery, 'limit' | 'position'>) => {
  const [position, setPosition] = useState(0);

  const query: SearchFiltersQuery = {
    ...filters,
    limit: DEFAULT_LIMIT,
    position,
  };

  const { data: searchResults, isLoading, isFetching } = useGetEmailSearchQuery(query, { skip: !filters.text });

  const onLoadMore = () => {
    if (isFetching || !searchResults?.hasMoreMails) return;
    setPosition((prev) => prev + DEFAULT_LIMIT);
  };

  const onReset = () => setPosition(0);

  return {
    searchEmails: searchResults?.emails ?? [],
    isLoading,
    isFetching,
    hasMoreEmails: searchResults?.hasMoreMails ?? false,
    onLoadMore,
    onReset,
  };
};

export default useEmailSearch;
