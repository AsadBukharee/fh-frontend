"use client"

import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import React, { useState, ChangeEvent } from "react"

interface UploadResponse {
  success: boolean
  message: string
  data: {
    url: string
    original_filename: string
    mime_type: string
    size: number
  }
}

interface Props {
  onUploadSuccess: (url: string) => void
}

export default function FileUploader({ onUploadSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch(`${API_URL}/media/upload_file/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: formData,
      })

      const result: UploadResponse = await res.json()
      if (!res.ok || !result.success) throw new Error("Upload failed")

      onUploadSuccess(result.data.url)
    } catch (err) {
      console.error(err)
      setError("Failed to upload. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3 p-3 border rounded-md bg-white shadow-sm">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select a File</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3
            file:rounded file:border-0 file:text-xs file:font-medium
            file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
        {selectedFile && (
          <p className="text-xs mt-1 text-gray-600 truncate">📎 {selectedFile.name}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="text-xs px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  )
}
