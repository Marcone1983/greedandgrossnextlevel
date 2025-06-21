import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isAdmin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: state => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isAdmin = action.payload.tier === 'admin';
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: state => {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.isAdmin = state.user.tier === 'admin';
      }
    },
    incrementDailyUsage: (state, action: PayloadAction<'messages' | 'crosses'>) => {
      if (state.user) {
        if (action.payload === 'messages') {
          state.user.stats.dailyMessagesUsed++;
        } else {
          state.user.stats.dailyCrossesUsed++;
        }
      }
    },
    resetDailyUsage: state => {
      if (state.user) {
        state.user.stats.dailyMessagesUsed = 0;
        state.user.stats.dailyCrossesUsed = 0;
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  incrementDailyUsage,
  resetDailyUsage,
} = authSlice.actions;

export default authSlice.reducer;
