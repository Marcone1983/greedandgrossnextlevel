import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Strain, CrossResult } from '@/types';

interface StrainState {
  userStrains: Strain[];
  crossHistory: CrossResult[];
  currentCross: CrossResult | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type: 'all' | 'sativa' | 'indica' | 'hybrid';
    terpene: string | null;
    effect: string | null;
  };
}

const initialState: StrainState = {
  userStrains: [],
  crossHistory: [],
  currentCross: null,
  isLoading: false,
  error: null,
  filters: {
    type: 'all',
    terpene: null,
    effect: null,
  },
};

const strainSlice = createSlice({
  name: 'strain',
  initialState,
  reducers: {
    setCrossLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCrossResult: (state, action: PayloadAction<CrossResult>) => {
      state.currentCross = action.payload;
      state.crossHistory.unshift(action.payload);
      if (!action.payload.cached) {
        state.userStrains.unshift(action.payload.result);
      }
      state.isLoading = false;
    },
    setCrossError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    addStrain: (state, action: PayloadAction<Strain>) => {
      state.userStrains.unshift(action.payload);
    },
    removeStrain: (state, action: PayloadAction<string>) => {
      state.userStrains = state.userStrains.filter(s => s.id !== action.payload);
    },
    setStrains: (state, action: PayloadAction<Strain[]>) => {
      state.userStrains = action.payload;
    },
    setCrossHistory: (state, action: PayloadAction<CrossResult[]>) => {
      state.crossHistory = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<StrainState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: state => {
      state.filters = initialState.filters;
    },
  },
});

export const {
  setCrossLoading,
  setCrossResult,
  setCrossError,
  addStrain,
  removeStrain,
  setStrains,
  setCrossHistory,
  setFilters,
  clearFilters,
} = strainSlice.actions;

export default strainSlice.reducer;
