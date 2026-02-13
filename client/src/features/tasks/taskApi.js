import { baseApi } from "../../app/baseApi";

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
      invalidatesTags: (_result, _error, { id }) => [{ type: "Task", id }],
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
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useReorderColumnMutation,
  useMoveTaskMutation,
} = taskApi;
