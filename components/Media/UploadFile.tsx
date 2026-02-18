"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent, DragEvent } from "react";
import { CheckCircle, Eye, Upload } from "lucide-react";
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
}

export default function FileUploader({ onUploadSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const cookies = useCookies();
  const inputId = "file-upload";

  const handleFile = (file: File | null) => {
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setUploadSuccess(false);
    handleUpload(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file ?? null);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/media/upload_file/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result: UploadResponse = await res.json();

      if (result.success) {
        setUploadedUrl(result.data.url);
        onUploadSuccess(result.data.url);
        setUploadSuccess(true);
      } else {
        setError(result.message || "Upload failed. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  // Drag & Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (!uploading) {
      document.getElementById(inputId)?.click();
    }
  };

  const isImage = uploadedUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const googleViewerUrl = uploadedUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(uploadedUrl)}&embedded=true`
    : "";

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-colors duration-200 ease-in-out cursor-pointer
          ${dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/30"
          }
          ${uploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          id={inputId}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {uploading ? (
            <div className="text-gray-600">Uploading…</div>
          ) : dragActive ? (
            <div className="text-blue-600 font-medium">Drop file here</div>
          ) : uploadSuccess && selectedFile ? (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-gray-800 break-all">
                {selectedFile.name}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Click or drag & drop your file here
                </p>
                <p className="text-xs text-gray-500">
                  Any file type • Max size depends on your server
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          {error}
        </p>
      )}

      {/* Success + Preview */}
      {uploadSuccess && uploadedUrl && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Uploaded successfully</span>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-5xl h-[90vh] overflow-auto p-6">
              <DialogHeader>
                <DialogTitle>File Preview</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center py-6 h-full">
                {isImage ? (
                  <img
                    src={uploadedUrl}
                    alt="Preview"
                    className="max-w-full max-h-[75vh] rounded-lg border shadow-sm object-contain"
                  />
                ) : (
                  <iframe
                    src={googleViewerUrl}
                    className="w-full h-[80vh] border rounded-lg shadow-sm"
                    title="File Preview"
                  />
                )}
                <p className="mt-6 text-sm text-gray-600 break-all text-center">
                  URL: {uploadedUrl}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}