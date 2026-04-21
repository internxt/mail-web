import type { Dayjs } from 'dayjs';
import type { DatePreset, FilterId } from '../types';

export interface FilterState {
  activeFilters: FilterId[];
  expandedFilter: FilterId | null;
  filterOffsetLeft: number;
  fromEmails: string[];
  toEmails: string[];
  datePreset: DatePreset;
  afterDate: Dayjs | null;
  beforeDate: Dayjs | null;
  searchQuery: string;
}

export const initialFilterState: FilterState = {
  activeFilters: [],
  expandedFilter: null,
  filterOffsetLeft: 0,
  fromEmails: [],
  toEmails: [],
  datePreset: 'anyDate',
  afterDate: null,
  beforeDate: null,
  searchQuery: '',
};

export const ActionTypes = {
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  ADD_EMAIL: 'ADD_EMAIL',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_DATE_PRESET: 'SET_DATE_PRESET',
  SET_AFTER_DATE: 'SET_AFTER_DATE',
  SET_BEFORE_DATE: 'SET_BEFORE_DATE',
  REMOVE_EMAIL: 'REMOVE_EMAIL',
  RESET: 'RESET',
} as const;

export type FiltersAction =
  | { type: (typeof ActionTypes)['TOGGLE_FILTER']; payload: { id: FilterId; offsetLeft: number } }
  | {
      type: (typeof ActionTypes)['ADD_EMAIL'];
      payload: { filterId: 'from' | 'to'; email: string };
    }
  | {
      type: (typeof ActionTypes)['SET_SEARCH_QUERY'];
      payload: { query: string };
    }
  | {
      type: (typeof ActionTypes)['SET_DATE_PRESET'];
      payload: { preset: DatePreset };
    }
  | {
      type: (typeof ActionTypes)['SET_AFTER_DATE'];
      payload: { date: Dayjs };
    }
  | {
      type: (typeof ActionTypes)['SET_BEFORE_DATE'];
      payload: { date: Dayjs };
    }
  | {
      type: (typeof ActionTypes)['REMOVE_EMAIL'];
      payload: { filterId: 'from' | 'to'; email: string };
    }
  | { type: (typeof ActionTypes)['RESET'] };
