import { baseApi } from "../../app/baseApi";

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation({
      query: ({ file, usage = "task" }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("usage", usage);
        return {
          url: "/upload",
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadFileMutation } = uploadApi;
