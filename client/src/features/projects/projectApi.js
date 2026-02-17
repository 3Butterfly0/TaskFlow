import { baseApi } from "../../app/baseApi";

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: () => "/projects",
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Project", id: _id })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),

    getProjectById: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Project", id }],
    }),

    createProject: builder.mutation({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),

    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Project", id: "LIST" },
        { type: "Project", id },
      ],
    }),

    togglePinProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/pin`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    updateLastAccessed: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/access`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useTogglePinProjectMutation,
  useUpdateLastAccessedMutation,
} = projectApi;
