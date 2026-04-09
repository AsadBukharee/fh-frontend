"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Maximize2, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface ImagePreviewDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  images: string[]
  initialIndex?: number
  title?: string
}

export default function ImagePreviewDialog({
  isOpen,
  onOpenChange,
  images,
  initialIndex = 0,
  title = "Document Preview"
}: ImagePreviewDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    resetTransform()
  }, [images.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    resetTransform()
  }, [images.length])

  const resetTransform = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  const currentUrl = images[currentIndex]
  const isPdf = currentUrl?.toLowerCase().endsWith(".pdf") || currentUrl?.includes("pdf")

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 overflow-hidden bg-black/95 border-none shadow-2xl flex flex-col rounded-[2rem]">
        <DialogHeader className="p-6 bg-white/5 backdrop-blur-md flex flex-row items-center justify-between border-b border-white/10 space-y-0">
          <div className="flex flex-col">
            <DialogTitle className="text-white text-xl font-bold">{title}</DialogTitle>
            {images.length > 1 && (
              <p className="text-white/40 text-xs font-medium mt-1">
                Image {currentIndex + 1} of {images.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pr-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRotate}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <RotateCw className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
            >
              <a href={currentUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden p-8">
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="absolute left-8 z-10 h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md transition-all active:scale-95"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-8 z-10 h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-md transition-all active:scale-95"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div 
            className="relative w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {isPdf ? (
              <iframe
                src={currentUrl}
                className="w-full h-full rounded-xl bg-white"
                title="PDF Preview"
              />
            ) : (
              <img
                src={currentUrl}
                alt={`Preview ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="p-6 bg-black/40 backdrop-blur-md flex justify-center gap-3">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx)
                  resetTransform()
                }}
                className={cn(
                  "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5",
                  currentIndex === idx ? "border-[#F26522] scale-110 shadow-[0_0_15px_rgba(242,101,34,0.3)]" : "border-white/10 opacity-40 hover:opacity-100"
                )}
              >
                <img src={url} className="w-full h-full object-cover rounded-lg" alt={`Thumb ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
