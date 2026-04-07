export interface SearchFilters {
  dateRange?: {
    after: number;
    before: number;
  };
  isRead?: boolean;
  hasAttachment?: boolean;
}

export type SearchField = 'subject' | 'body' | 'from' | 'to';

export interface SearchOptions {
  fields?: SearchField[];
  limit?: number;
  boost?: Partial<Record<SearchField, number>>;
  filters?: SearchFilters;
}

export interface SearchResult<T> {
  item: T;
  score: number;
}
