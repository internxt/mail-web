import { useState, useCallback, useEffect, useRef } from 'react';
import type { SearchFiltersQuery, EmailListResponse } from '@internxt/sdk/dist/mail/types';
import { MailService } from '@/services/sdk/mail';
import { useDebounce } from '../useDebounce';

const DEFAULT_LIMIT = 25;

export const useEmailSearch = (filters: Omit<SearchFiltersQuery, 'limit' | 'position'>) => {
  const [position, setPosition] = useState(0);
  const [results, setResults] = useState<EmailListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const activeControllerRef = useRef<AbortController | null>(null);

  const debouncedText = useDebounce(filters.text, 500);

  const fetchResults = useCallback(
    async (pos: number, signal: AbortSignal) => {
      if (!debouncedText) {
        setResults(null);
        setPosition(0);
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
        if (signal.aborted) return;
        setResults((prev) => (pos === 0 ? data : { ...data, emails: [...(prev?.emails ?? []), ...data.emails] }));
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [debouncedText, filters.from, filters.to, filters.after, filters.before, filters.hasAttachment, filters.unread],
  );

  useEffect(() => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setPosition(0);
    fetchResults(0, controller.signal);
    return () => {
      controller.abort();
      activeControllerRef.current = null;
    };
  }, [fetchResults]);

  const onLoadMore = () => {
    if (isLoading || !results?.hasMoreMails) return;
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const next = position + DEFAULT_LIMIT;
    setPosition(next);
    fetchResults(next, controller.signal);
  };

  return {
    searchEmails: results?.emails ?? [],
    isLoading,
    hasMoreEmails: results?.hasMoreMails ?? false,
    onLoadMore,
  };
};

export default useEmailSearch;
