"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent } from "react";
import { CheckCircle } from "lucide-react";

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
  accept?: string; // e.g., "image/*,application/pdf"
  maxSize?: number; // in bytes
  id?: string; // For accessibility
}

export default function FileUploader({ onUploadSuccess, accept = "image/*,application/pdf", maxSize = 5 * 1024 * 1024, id = "file-upload" }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const cookies = useCookies();
  const token = cookies.get("access_token");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadSuccess(false);
    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!token) {
      setError("Authentication token missing. Please log in.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/media/upload_media/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const result: UploadResponse = await res.json();
      if (result.success) {
        onUploadSuccess(result.data.url);
        setUploadSuccess(true);
        setSelectedFile(null); // Reset after successful upload
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

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="relative">
        <div className="relative flex items-center">
          <input
            id={id}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
              file:text-sm file:font-semibold file:bg-orange-50
              file:text-orange-700 hover:file:bg-orange-100
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={uploading || !token}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {uploadSuccess && !uploading && (
            <CheckCircle
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500"
              aria-label="Upload successful"
            />
          )}
        </div>
      </div>

      {uploading && <span className="text-sm text-gray-700">Uploading...</span>}

      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-500 mt-2"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}