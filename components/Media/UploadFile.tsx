"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent } from "react";
import { CheckCircle, Eye } from "lucide-react";
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
  const cookies = useCookies();
  const inputId = "file-upload";

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadSuccess(false);
      await handleUpload(file);
    }
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

  const isImage = uploadedUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const googleViewerUrl = uploadedUrl
    ? `https://docs.google.com/gview?url=${uploadedUrl}&embedded=true`
    : "";

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="relative">
        <input
          id={inputId}
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
            file:text-sm file:font-semibold file:bg-orange-50
            file:text-orange-700 hover:file:bg-orange-100
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={uploading}
          aria-describedby={error ? "error-message" : undefined}
        />
      </div>

      {/* Status messages and icons at the bottom */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {uploading && <span className="text-sm text-gray-700">Uploading...</span>}
          {error && (
            <p
              id="error-message"
              className="text-sm text-red-500"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        
        {/* Icons container - Only show when upload is successful */}
        {uploadSuccess && uploadedUrl && (
          <div className="flex items-center space-x-3 ml-4">
            {/* Tick icon for success */}
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600">Uploaded</span>
            </div>

            {/* Eye icon for preview - Only show if there's a URL to preview */}
            <Dialog>
              <DialogTrigger asChild>
                <button 
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  type="button"
                >
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">Preview</span>
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl h-[85vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Preview</DialogTitle>
                </DialogHeader>

                {isImage ? (
                  <img
                    src={uploadedUrl}
                    alt="Preview"
                    className="rounded-md border w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={googleViewerUrl}
                    className="w-full h-[80vh] border rounded"
                    title="Document Preview"
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}