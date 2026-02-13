import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

/**
 * RTK Query base API.
 *
 * All feature-specific endpoints are injected into this single API
 * via `baseApi.injectEndpoints()` in their respective feature folders.
 *
 * The base URL is "/api" and is proxied to the backend in dev
 * (see vite.config.js proxy config).
 *
 * Credentials are included so HttpOnly JWT cookies are sent automatically.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include", // send cookies with every request
  }),
  tagTypes: ["User", "Project", "Task", "Ticket"],
  endpoints: () => ({}), // injected by feature slices
});
