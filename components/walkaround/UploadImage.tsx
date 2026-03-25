"use client";

import React, { useState, useRef, useCallback } from "react";
import { Camera, Upload, X } from "lucide-react";
import API_URL from "@/app/utils/ENV";
import { useCookies } from "next-client-cookies";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  cameraFacing?: "user" | "environment";
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess, cameraFacing = "environment" }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cookies = useCookies();
  const token = cookies.get("access_token");

  // Debounce utility to prevent rapid camera restarts
  const debounce = <T extends (...args: any[]) => void>(func: T, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setIsCapturing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((error) => {
            console.error("Error playing video:", error);
            setIsCapturing(false);
            alert("Camera error. Try uploading a file instead.");
          });
          setIsCameraLoading(false);
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions or use file upload.");
      setIsCapturing(false);
      setIsCameraLoading(false);
    }
  }, [cameraFacing]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false; // Explicitly disable tracks
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Clear video source
    }
    setIsCapturing(false);
    setIsCameraLoading(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          await uploadImage(blob);
        }
      },
      "image/jpeg",
      0.8
    );

    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  }, []);

  const uploadImage = async (file: Blob | File) => {
    if (!token) {
      alert("Authentication required. Please log in.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    const fileName = (file as File).name || `capture_${Date.now()}.jpg`;
    formData.append("file", file, fileName);

    try {
      const res = await fetch(`${API_URL}/media/upload_media/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();

      if (result.success && result.data?.url) {
        onUploadSuccess(result.data.url);
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Debounced camera start to prevent rapid restarts
  const startCameraDebounced = useCallback(
    debounce(() => {
      startCamera();
    }, 300),
    [startCamera]
  );

  // Handle camera facing changes
  React.useEffect(() => {
    if (isCapturing && stream) {
      stopCamera();
      startCameraDebounced();
    }
  }, [cameraFacing, isCapturing, stream, stopCamera, startCameraDebounced]);

  if (isCapturing) {
    return (
      <div className="space-y-4">
        {isCameraLoading ? (
          <div className="flex justify-center items-center h-64 bg-black rounded-lg">
            <p className="text-white">Loading camera...</p>
          </div>
        ) : (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={capturePhoto}
            disabled={uploading || isCameraLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            <Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : "Capture"}
          </button>

          <button
            onClick={stopCamera}
            disabled={isCameraLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    );
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
  );
};

export default ImageUploader;