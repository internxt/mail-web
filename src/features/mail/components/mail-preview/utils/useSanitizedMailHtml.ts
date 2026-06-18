import { useMemo } from 'react';
import { sanitizeMailHtml } from './sanitize-mail-html';

export const useSanitizedMailHtml = (html: string): string => {
  return useMemo(() => sanitizeMailHtml(html), [html]);
};
