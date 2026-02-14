import { baseApi } from "../../app/baseApi";

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasksByProject: builder.query({
      query: (projectId) => `/tasks?projectId=${projectId}`,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Task", id }],
    }),

    createTask: builder.mutation({
      query: (body) => ({
        url: "/tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Task", id: "LIST" },
      ],
    }),

    updateTask: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tasks/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
      ],
    }),

    addComment: builder.mutation({
      query: ({ taskId, text }) => ({
        url: `/tasks/${taskId}/comments`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),

    reorderColumn: builder.mutation({
      query: (body) => ({
        url: "/tasks/reorder",
        method: "PATCH",
        body,
      }),
      // Optimistic UI will handle state – no automatic invalidation
    }),

    moveTask: builder.mutation({
      query: (body) => ({
        url: "/tasks/move",
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Project", id: projectId },
      ],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useAddCommentMutation,
  useReorderColumnMutation,
  useMoveTaskMutation,
} = taskApi;
