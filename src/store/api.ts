import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// import { Strain, ChatMessage, AdminStats } from '@/types';

const API_BASE_URL = 'https://api.greedandgross.com';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
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
  endpoints: builder => ({
    // Strain endpoints
    getPopularStrains: builder.query({
      query: () => '/strains/popular',
      providesTags: ['Strain'],
    }),
    searchStrains: builder.query({
      query: search => `/strains/search?q=${encodeURIComponent(search)}`,
      providesTags: ['Strain'],
    }),

    // Chat endpoints
    getRecentMessages: builder.query({
      query: () => '/chat/recent',
      providesTags: ['Chat'],
    }),

    // Admin endpoints
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Stats'],
    }),
    downloadDatabase: builder.mutation({
      query: ({ format }) => ({
        url: `/admin/export?format=${format}`,
        method: 'GET',
        responseHandler: response => response.blob(),
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
