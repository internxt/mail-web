import { ActionTypes, initialFilterState, type FiltersAction, type FilterState } from './filters.config';

export const filterReducer = (state: FilterState, action: FiltersAction): FilterState => {
  switch (action.type) {
    case ActionTypes.TOGGLE_FILTER: {
      const { id, offsetLeft } = action.payload;
      if (id === 'from' || id === 'to' || id === 'date') {
        const isCollapsing = state.expandedFilter === id;
        const shouldResetPreset =
          isCollapsing && id === 'date' && state.datePreset === 'specificDate' && !state.afterDate && !state.beforeDate;
        return {
          ...state,
          expandedFilter: isCollapsing ? null : id,
          filterOffsetLeft: isCollapsing ? state.filterOffsetLeft : offsetLeft,
          datePreset: shouldResetPreset ? 'anyDate' : state.datePreset,
        };
      }
      const isActive = state.activeFilters.includes(id);
      return {
        ...state,
        activeFilters: isActive ? state.activeFilters.filter((f) => f !== id) : [...state.activeFilters, id],
      };
    }

    case ActionTypes.SET_SEARCH_QUERY: {
      const { query } = action.payload;
      return {
        ...state,
        searchQuery: query,
      };
    }

    case ActionTypes.ADD_EMAIL: {
      const { filterId, email } = action.payload;
      const key = filterId === 'from' ? 'fromEmails' : 'toEmails';
      return {
        ...state,
        [key]: [...state[key], email],
        activeFilters: state.activeFilters.includes(filterId)
          ? state.activeFilters
          : [...state.activeFilters, filterId],
      };
    }

    case ActionTypes.REMOVE_EMAIL: {
      const { filterId, email } = action.payload;
      const key = filterId === 'from' ? 'fromEmails' : 'toEmails';
      const next = state[key].filter((e) => e !== email);
      return {
        ...state,
        [key]: next,
        activeFilters: next.length === 0 ? state.activeFilters.filter((f) => f !== filterId) : state.activeFilters,
      };
    }

    case ActionTypes.SET_DATE_PRESET: {
      const { preset } = action.payload;
      if (preset === 'anyDate') {
        return {
          ...state,
          datePreset: 'anyDate',
          afterDate: null,
          beforeDate: null,
          activeFilters: state.activeFilters.filter((f) => f !== 'date'),
        };
      }
      return {
        ...state,
        datePreset: preset,
        expandedFilter: preset === 'specificDate' ? state.expandedFilter : null,
        activeFilters: state.activeFilters.includes('date') ? state.activeFilters : [...state.activeFilters, 'date'],
      };
    }

    case ActionTypes.SET_AFTER_DATE:
      return { ...state, afterDate: action.payload.date };

    case ActionTypes.SET_BEFORE_DATE:
      return { ...state, beforeDate: action.payload.date };

    case ActionTypes.RESET:
      return initialFilterState;
  }
};
