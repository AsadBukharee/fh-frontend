"use client"

import React, { useState, useRef, useCallback } from "react"
import { Camera, Upload, X } from "lucide-react"

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void
  cameraFacing?: "user" | "environment"
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess, cameraFacing = "environment" }) => {
  const [isCapturing, setIsCapturing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setStream(mediaStream)
      setIsCapturing(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions or use file upload.")
    }
  }, [cameraFacing])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await uploadImage(blob)
        }
      },
      "image/jpeg",
      0.8,
    )

    stopCamera()
  }, [stopCamera])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadImage(file)
    }
  }, [])

  const uploadImage = async (file: Blob) => {
    setUploading(true)
    try {
      // Create a mock URL for demo purposes
      // In a real app, you would upload to your server or cloud storage
      const url = URL.createObjectURL(file)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onUploadSuccess(url)
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  // Update camera when facing changes
  React.useEffect(() => {
    if (isCapturing) {
      stopCamera()
      setTimeout(() => startCamera(), 100)
    }
  }, [cameraFacing, isCapturing, startCamera, stopCamera])

  if (isCapturing) {
    return (
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={capturePhoto}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : "Capture"}
          </button>

          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

      <p className="text-xs text-gray-500">Camera facing: {cameraFacing === "user" ? "Front" : "Back"}</p>
    </div>
  )
}

export default ImageUploader
