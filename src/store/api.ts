import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@env';
import { Strain, ChatMessage, AdminStats } from '@/types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL || 'https://api.greedandgross.com',
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as any;
      const user = state.auth.user;
      if (user) {
        headers.set('x-user-id', user.id);
        headers.set('x-user-tier', user.tier);
      }
      return headers;
    },
  }),
  tagTypes: ['Strain', 'Chat', 'Stats'],
  endpoints: (builder) => ({
    // Strain endpoints
    getPopularStrains: builder.query<Strain[], void>({
      query: () => '/strains/popular',
      providesTags: ['Strain'],
    }),
    searchStrains: builder.query<Strain[], string>({
      query: (search) => `/strains/search?q=${encodeURIComponent(search)}`,
      providesTags: ['Strain'],
    }),
    
    // Chat endpoints
    getRecentMessages: builder.query<ChatMessage[], void>({
      query: () => '/chat/recent',
      providesTags: ['Chat'],
    }),
    
    // Admin endpoints
    getAdminStats: builder.query<AdminStats, void>({
      query: () => '/admin/stats',
      providesTags: ['Stats'],
    }),
    downloadDatabase: builder.mutation<Blob, { format: 'json' | 'csv' }>({
      query: ({ format }) => ({
        url: `/admin/export?format=${format}`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetPopularStrainsQuery,
  useSearchStrainsQuery,
  useGetRecentMessagesQuery,
  useGetAdminStatsQuery,
  useDownloadDatabaseMutation,
} = api;