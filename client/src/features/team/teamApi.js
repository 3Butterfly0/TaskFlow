import { baseApi } from "../../app/baseApi";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query({
      query: (projectId) => `/projects/${projectId}/members`,
      providesTags: (result, _error, projectId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Member", id: _id })),
              { type: "Member", id: "LIST" },
            ]
          : [{ type: "Member", id: "LIST" }],
    }),

    addMember: builder.mutation({
      query: ({ projectId, email }) => ({
        url: `/projects/${projectId}/members`,
        method: "POST",
        body: { email },
      }),
      invalidatesTags: [
        { type: "Member", id: "LIST" },
        { type: "Project", id: "LIST" },
      ],
    }),

    removeMember: builder.mutation({
      query: ({ projectId, memberId }) => ({
        url: `/projects/${projectId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { memberId }) => [
        { type: "Member", id: memberId },
        { type: "Member", id: "LIST" },
        { type: "Project", id: "LIST" },
      ],
    }),

    transferOwnership: builder.mutation({
      query: ({ projectId, memberId }) => ({
        url: `/projects/${projectId}/members/${memberId}/role`,
        method: "PATCH",
      }),
      invalidatesTags: [
        { type: "Member", id: "LIST" },
        { type: "Project", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
} = teamApi;
