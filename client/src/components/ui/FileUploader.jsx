import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadFileMutation } from "../../features/upload/uploadApi";

const FileUploader = ({ onUpload, disabled }) => {
  const [uploadFile, { isLoading }] = useUploadFileMutation();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        const response = await uploadFile(file).unwrap();
        if (response.data) {
          onUpload(response.data);
        }
      } catch {
        // Error is handled by global error handler usually, but show local error if needed?
        // For now, console error.
      }
    },
    [uploadFile, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isLoading,
    multiple: false, // Single file for now, simple
  });

  return (
    <div
      {...getRootProps()}
      className={`relative flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 transition-colors ${
        isDragActive
          ? "border-indigo-500 bg-indigo-500/10"
          : "hover:border-slate-600 hover:bg-slate-800/50"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="size-5 animate-spin rounded-full border-2 border-slate-500 border-t-indigo-500" />
          <p className="text-xs text-slate-500">Uploading…</p>
        </div>
      ) : isDragActive ? (
        <p className="text-xs font-medium text-indigo-400">Drop file here…</p>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs text-slate-400">
            <span className="font-medium text-indigo-400">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-[10px] text-slate-600">Max 5MB</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
