import { baseApi } from "../../app/baseApi";

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    search: builder.query({
      query: ({ q, type }) => ({
        url: "/search",
        params: { q, type },
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useSearchQuery, useLazySearchQuery } = searchApi;
