import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '@/types';

interface ChatState {
  globalMessages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  onlineUsers: number;
}

const initialState: ChatState = {
  globalMessages: [],
  isConnected: false,
  isLoading: false,
  error: null,
  onlineUsers: 0,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.globalMessages.push(action.payload);
      // Keep only last 100 messages
      if (state.globalMessages.length > 100) {
        state.globalMessages.shift();
      }
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.globalMessages = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<number>) => {
      state.onlineUsers = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.globalMessages = [];
    },
  },
});

export const {
  setConnected,
  addMessage,
  setMessages,
  setOnlineUsers,
  setLoading,
  setError,
  clearChat,
} = chatSlice.actions;

export default chatSlice.reducer;