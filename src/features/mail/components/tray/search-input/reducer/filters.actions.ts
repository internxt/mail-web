import type { Dayjs } from 'dayjs';
import type { DatePreset, FilterId } from '../types';
import { ActionTypes } from './filters.config';

export const setToggleFilter = (id: FilterId, offsetLeft: number) => ({
  type: ActionTypes.TOGGLE_FILTER,
  payload: { id, offsetLeft },
});

export const setAddEmail = (filterId: 'from' | 'to', email: string) => ({
  type: ActionTypes.ADD_EMAIL,
  payload: { filterId, email },
});

export const setSearchQuery = (query: string) => ({
  type: ActionTypes.SET_SEARCH_QUERY,
  payload: { query },
});

export const setRemoveEmail = (filterId: 'from' | 'to', email: string) => ({
  type: ActionTypes.REMOVE_EMAIL,
  payload: { filterId, email },
});

export const setDatePreset = (preset: DatePreset) => ({
  type: ActionTypes.SET_DATE_PRESET,
  payload: { preset },
});

export const setAfterDate = (date: Dayjs | null) => ({
  type: ActionTypes.SET_AFTER_DATE,
  payload: { date },
});

export const setBeforeDate = (date: Dayjs | null) => ({
  type: ActionTypes.SET_BEFORE_DATE,
  payload: { date },
});

export const resetFilters = () => ({ type: ActionTypes.RESET });
