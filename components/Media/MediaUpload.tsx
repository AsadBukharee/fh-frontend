"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent, DragEvent, useEffect } from "react";
import { CheckCircle, Eye, Upload, File } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    original_filename: string;
    mime_type: string;
    size: number;
  };
}

interface Props {
  onUploadSuccess: (url: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number;       // in bytes
  id?: string;
  trigger?: React.ReactNode;
  hideDefaultUI?: boolean;
  className?: string;
  initialFile?: File | null;
  disabled?: boolean;
}

export default function FileUploader({
  onUploadSuccess,
  onUploadStart,
  onUploadError,
  accept = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
  maxSize = 5 * 1024 * 1024, // 5MB default
  id = "file-upload",
  trigger,
  hideDefaultUI = false,
  className,
  initialFile,
  disabled = false,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const cookies = useCookies();
  const token = cookies.get("access_token");

  useEffect(() => {
    if (initialFile && !disabled) {
      handleFile(initialFile);
    }
  }, [initialFile, disabled]);

  const handleFile = (file: File | null) => {
    if (!file || disabled) return;

    // Size validation
    if (maxSize && file.size > maxSize) {
      const sizeErr = `File too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)} MB`;
      setError(sizeErr);
      onUploadError?.(sizeErr);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadSuccess(false);
    handleUpload(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async (file: File) => {
    if (!token) {
      const authErr = "Authentication required. Please log in.";
      setError(authErr);
      onUploadError?.(authErr);
      return;
    }

    setUploading(true);
    setError(null);
    onUploadStart?.();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/media/upload_media/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result: UploadResponse = await res.json();

      if (result.success) {
        setUploadedUrl(result.data.url);
        onUploadSuccess(result.data.url);
        setUploadSuccess(true);
        // We keep selectedFile so we can show the name
      } else {
        const errMsg = result.message || "Upload failed";
        setError(errMsg);
        onUploadError?.(errMsg);
      }
    } catch (err) {
      console.error(err);
      const errMsg = "Upload error. Please try again.";
      setError(errMsg);
      onUploadError?.(errMsg);
    } finally {
      setUploading(false);
    }
  };

  // ── Drag & Drop ───────────────────────────────────────
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const openFilePicker = () => {
    if (!uploading && token && !disabled) {
      document.getElementById(id)?.click();
    }
  };

  const isImage = uploadedUrl?.match(/\.(jpe?g|png|gif|webp|svg)$/i);
  const googleViewerUrl = uploadedUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(uploadedUrl)}&embedded=true`
    : "";

  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);

  return (
    <div className={className || "w-full"}>
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading || !token || disabled}
      />

      {trigger ? (
        <div
          onClick={openFilePicker}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative transition-all duration-200 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${dragActive && !disabled ? "opacity-75 scale-[1.01]" : ""}`}
        >
          {trigger}
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 rounded-[2rem] z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-200 border-t-orange-600"></div>
              <span className="text-xs font-semibold text-slate-600">Uploading...</span>
            </div>
          )}
        </div>
      ) : !hideDefaultUI ? (
        <div className="w-full max-w-md space-y-4">
          {/* Drop Zone */}
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 text-center
              transition-all duration-200 cursor-pointer
              ${dragActive
                ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                : "border-gray-300 hover:border-blue-400 bg-gray-50/70 hover:bg-blue-50/30"
              }
              ${uploading || !token ? "opacity-60 cursor-not-allowed" : ""}
            `}
            onClick={openFilePicker}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3">
              {uploading ? (
                <div className="text-gray-600 font-medium">Uploading...</div>
              ) : dragActive ? (
                <div className="text-blue-600 font-semibold text-lg">
                  Drop file here
                </div>
              ) : uploadSuccess && selectedFile ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div className="text-sm font-medium text-gray-800 break-all px-4">
                    {selectedFile.name}
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400" />
                  <div className="space-y-1.5">
                    <p className="text-base font-medium text-gray-700">
                      Click or drag & drop your file
                    </p>
                    <p className="text-xs text-gray-500">
                      {accept.includes("image") ? "Images, " : ""}
                      PDF, Word, Excel, PowerPoint • max {maxSizeMB} MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success + Preview button */}
          {uploadSuccess && uploadedUrl && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">File uploaded</span>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-5xl h-[90vh] p-6">
                  <DialogHeader>
                    <DialogTitle>File Preview</DialogTitle>
                  </DialogHeader>

                  <div className="flex-1 flex flex-col items-center justify-center py-8 gap-6">
                    {isImage ? (
                      <img
                        src={uploadedUrl}
                        alt="Preview"
                        className="max-w-full max-h-[70vh] rounded-lg border shadow-md object-contain"
                      />
                    ) : (
                      <iframe
                        src={googleViewerUrl}
                        className="w-full h-[75vh] rounded-lg border shadow-sm"
                        title="Document preview"
                      />
                    )}

                    <div className="text-sm text-gray-600 text-center break-all max-w-2xl">
                      {uploadedUrl}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}