import { baseApi } from "../../app/baseApi";

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjectAnalytics: builder.query({
      query: (projectId) => `/analytics/${projectId}`,
      providesTags: ["Analytics", "Task"], // Re-fetch when tasks change
    }),
  }),
});

export const { useGetProjectAnalyticsQuery } = analyticsApi;
