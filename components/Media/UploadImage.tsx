"use client"

import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import React, { useState, ChangeEvent } from "react"

interface UploadResponse {
  success: boolean
  message: string
  data: {
    url: string
    thumbnail_url: string
    original_filename: string
  }
}

interface Props {
  onUploadSuccess: (url: string) => void
}


export default function ImageUploader({ onUploadSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
    const cookies = useCookies()

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
      const res = await fetch(`${API_URL}/media/upload_image/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cookies.get("access_token")}` // Assuming you store token in cookies
        },
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const result: UploadResponse = await res.json()

      if (result.success) {
        onUploadSuccess(result.data.url)
      } else {
        setError("Upload failed. Try again.")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred during upload.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 w-full max-w-md p-4 border rounded-lg shadow-sm bg-white">
      <label className="block text-sm font-medium text-gray-700">Upload Image</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0 file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {preview && (
        <div className="mt-2">
          <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded" />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
