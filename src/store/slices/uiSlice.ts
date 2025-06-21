import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  adminTaps: number;
  lastTapTime: number;
  isAdminPanelVisible: boolean;
  activeTab: string;
  modals: {
    strainSelector: boolean;
    exportPDF: boolean;
    shareStrain: boolean;
  };
}

const initialState: UIState = {
  theme: 'dark',
  adminTaps: 0,
  lastTapTime: 0,
  isAdminPanelVisible: false,
  activeTab: 'LabChat',
  modals: {
    strainSelector: false,
    exportPDF: false,
    shareStrain: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: state => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    incrementAdminTaps: state => {
      const now = Date.now();
      if (now - state.lastTapTime > 1000) {
        // Reset if more than 1 second between taps
        state.adminTaps = 1;
      } else {
        state.adminTaps++;
      }
      state.lastTapTime = now;

      // Check for admin access
      if (state.adminTaps >= 7) {
        state.isAdminPanelVisible = true;
        state.adminTaps = 0;
      }
    },
    resetAdminTaps: state => {
      state.adminTaps = 0;
    },
    setAdminPanelVisible: (state, action: PayloadAction<boolean>) => {
      state.isAdminPanelVisible = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  incrementAdminTaps,
  resetAdminTaps,
  setAdminPanelVisible,
  setActiveTab,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
