import { baseApi } from "../../app/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),

    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),

    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/auth/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/password",
        method: "PATCH",
        body,
      }),
    }),

    setupMfa: builder.mutation({
      query: () => ({
        url: "/auth/mfa/setup",
        method: "POST",
      }),
    }),

    verifyMfa: builder.mutation({
      query: (body) => ({
        url: "/auth/mfa/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    disableMfa: builder.mutation({
      query: (body) => ({
        url: "/auth/mfa/disable",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    validateMfa: builder.mutation({
      query: (body) => ({
        url: "/auth/mfa/validate",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetupMfaMutation,
  useVerifyMfaMutation,
  useDisableMfaMutation,
  useValidateMfaMutation,
} = authApi;
