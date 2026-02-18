"use client";

import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";
import React, { useState, ChangeEvent, DragEvent } from "react";
import { CheckCircle, Eye, Upload, X } from "lucide-react";
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
    thumbnail_url: string;
    original_filename: string;
  };
}

interface Props {
  onUploadSuccess: (url: string) => void;
}

export default function ImageUploader({ onUploadSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedThumbnailUrl, setUploadedThumbnailUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const cookies = useCookies();
  const inputId = "image-upload";

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

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
      const res = await fetch(`${API_URL}/media/upload_image/`, {
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
        setUploadedThumbnailUrl(result.data.thumbnail_url || result.data.url);
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

  // ── Drag & Drop Handlers ───────────────────────────────────────
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
    document.getElementById(inputId)?.click();
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* ── Drop Zone ──────────────────────────────────────────────── */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          transition-colors duration-200 ease-in-out cursor-pointer
          ${dragActive 
            ? "border-orange-500 bg-orange-50" 
            : "border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50/40"
          }
          ${uploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? handleClick : undefined}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {uploading ? (
            <div className="text-gray-600">Uploading…</div>
          ) : dragActive ? (
            <div className="text-orange-600 font-medium">Drop image here</div>
          ) : uploadSuccess && selectedFile ? (
            <>
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Click or drag & drop your image here
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, WEBP (max 10MB recommended)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
          {error}
        </p>
      )}

      {/* Success state + preview */}
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

            <DialogContent className="max-w-4xl h-[90vh] overflow-auto p-6">
              <DialogHeader>
                <DialogTitle>Image Preview</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center py-6">
                <img
                  src={uploadedUrl}
                  alt="Uploaded preview"
                  className="max-w-full max-h-[70vh] rounded-lg border shadow-sm object-contain"
                />
                <div className="mt-6 text-sm text-gray-600 space-y-1 text-center">
                  <p>URL: <span className="font-mono break-all">{uploadedUrl}</span></p>
                  {uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedUrl && (
                    <p>Thumbnail: <span className="font-mono break-all">{uploadedThumbnailUrl}</span></p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Optional small thumbnail preview */}
      {uploadSuccess && uploadedThumbnailUrl && uploadedThumbnailUrl !== uploadedUrl && (
        <div className="border rounded p-3 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Thumbnail preview:</p>
          <img
            src={uploadedThumbnailUrl}
            alt="Thumbnail"
            className="h-20 w-20 object-cover rounded"
          />
        </div>
      )}
    </div>
  );
}