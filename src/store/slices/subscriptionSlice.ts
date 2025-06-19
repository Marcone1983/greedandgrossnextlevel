import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Subscription } from '@/types';

interface SubscriptionState {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  products: {
    monthly: { id: string; price: string };
    yearly: { id: string; price: string };
  } | null;
}

const initialState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
  products: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<Subscription>) => {
      state.subscription = action.payload;
    },
    setProducts: (state, action: PayloadAction<SubscriptionState['products']>) => {
      state.products = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSubscription: (state) => {
      state.subscription = null;
    },
  },
});

export const {
  setSubscription,
  setProducts,
  setLoading,
  setError,
  clearSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;