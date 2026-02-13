import { baseApi } from "../../app/baseApi";

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query({
      query: ({ projectId, status, severity }) => {
        const params = new URLSearchParams({ projectId });
        if (status) params.set("status", status);
        if (severity) params.set("severity", severity);
        return `/tickets?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Ticket", id: _id })),
              { type: "Ticket", id: "LIST" },
            ]
          : [{ type: "Ticket", id: "LIST" }],
    }),

    createTicket: builder.mutation({
      query: (body) => ({
        url: "/tickets",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Ticket", id: "LIST" }],
    }),

    promoteTicket: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tickets/${id}/promote`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Ticket", id },
        { type: "Ticket", id: "LIST" },
        { type: "Task", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useCreateTicketMutation,
  usePromoteTicketMutation,
} = ticketApi;
