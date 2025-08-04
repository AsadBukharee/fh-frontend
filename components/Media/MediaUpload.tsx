// FileUploader.tsx
"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent } from "react";

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

export default function FileUploader({ onUploadSuccess, accept = "image/*,application/pdf", maxSize = 5 * 1024 * 1024, id }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cookies = useCookies();
  const token = cookies.get("access_token");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (maxSize && file.size > maxSize) {
      setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!token) {
      setError("Authentication token missing. Please log in.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_URL}/media/upload_media/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result: UploadResponse = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }

      onUploadSuccess(result.data.url);
      setSelectedFile(null); // Reset after successful upload
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select a File
        </label>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-semibold
            file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {selectedFile && (
          <p className="text-sm mt-1 text-gray-600 truncate">
            📎 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || !token}
          className="text-sm px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {error && (
          <span id={`${id}-error`} className="text-sm text-red-500">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}