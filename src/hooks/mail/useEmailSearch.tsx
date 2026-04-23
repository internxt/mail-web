import { useState, useCallback, useEffect } from 'react';
import type { SearchFiltersQuery, EmailListResponse } from '@internxt/sdk';
import { MailService } from '@/services/sdk/mail';
import { useDebounce } from '../useDebounce';

const DEFAULT_LIMIT = 25;

export const useEmailSearch = (filters: Omit<SearchFiltersQuery, 'limit' | 'position'>) => {
  const [position, setPosition] = useState(0);
  const [results, setResults] = useState<EmailListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedText = useDebounce(filters.text, 500);

  const fetchResults = useCallback(
    async (pos: number) => {
      if (!debouncedText) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const data = await MailService.instance.search({
          ...filters,
          text: debouncedText,
          limit: DEFAULT_LIMIT,
          position: pos,
        });
        setResults((prev) => (pos === 0 ? data : { ...data, emails: [...(prev?.emails ?? []), ...data.emails] }));
      } finally {
        setIsLoading(false);
      }
    },
    [debouncedText, filters.from, filters.to, filters.after, filters.before, filters.hasAttachment, filters.unread],
  );

  useEffect(() => {
    setPosition(0);
    fetchResults(0);
  }, [fetchResults]);

  const onLoadMore = () => {
    if (isLoading || !results?.hasMoreMails) return;
    const next = position + DEFAULT_LIMIT;
    setPosition(next);
    fetchResults(next);
  };

  return {
    searchEmails: results?.emails ?? [],
    isLoading,
    hasMoreEmails: results?.hasMoreMails ?? false,
    onLoadMore,
  };
};

export default useEmailSearch;
