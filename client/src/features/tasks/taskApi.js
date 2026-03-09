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

    getHistoryTasks: builder.query({
      query: (projectId) =>
        `/tasks?projectId=${projectId}&status=completed,cancelled,rejected`,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "HISTORY_LIST" },
            ]
          : [{ type: "Task", id: "HISTORY_LIST" }],
    }),

    getMyTasks: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append("status", params.status);
        if (params?.priority) queryParams.append("priority", params.priority);
        if (params?.projectId)
          queryParams.append("projectId", params.projectId);
        return `/tasks/my-tasks?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Task", id: _id })),
              { type: "Task", id: "GLOBAL_LIST" },
            ]
          : [{ type: "Task", id: "GLOBAL_LIST" }],
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
      invalidatesTags: (_result, _error, { id, projectId }) => [
        { type: "Task", id },
        { type: "Task", id: "LIST" },
        ...(projectId ? [{ type: "Project", id: projectId }] : []),
        { type: "Project", id: "LIST" },
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
      invalidatesTags: (_result, _error, { projectId, taskId }) => [
        { type: "Project", id: projectId },
        { type: "Task", id: taskId },
        { type: "Task", id: "LIST" },
        { type: "Task", id: "HISTORY_LIST" },
      ],
    }),

    deleteTask: builder.mutation({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: () => [
        { type: "Task", id: "LIST" },
        { type: "Project", id: "LIST" }, // Or specific project if available? We don't have projectId in arg easily unless passed.
        // Usually Project ID is needed to invalidate specific Project.
        // But invalidating LIST is safe though heavy.
        // Wait, DELETE returns { id }.
      ],
    }),
  }),
});

export const {
  useGetTasksByProjectQuery,
  useGetHistoryTasksQuery,
  useGetMyTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useAddCommentMutation,
  useReorderColumnMutation,
  useMoveTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
