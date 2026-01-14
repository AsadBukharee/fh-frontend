"use client"

import { formatDmy } from "@/lib/utils"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search,
  Download,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Calendar,
  Car,
  CreditCard,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Move,
  Download as DownloadIcon,
} from "lucide-react"
import GradientButton from "@/app/utils/GradientButton"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import AddFuelLogDialog from "@/components/fuel-check/AddFuelCheck"
import { Loader2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import ExportButton from "@/app/utils/ExportButton"

interface FuelLog {
  id: number
  vehicle: number
  vehicle_data: {
    id: number
    registration_number: string
    vehicles_type_name: string
    last_mileage: string
    purchase_mileage: string | null
    mileage_unit: string
    mileage_in_km: number | null
    mileage_in_miles: number | null
    site_allocated: { id: number; name: string; status: string; image: string }[]
  }
  date: string
  time: string
  vehicle_photo: string | null
  driver: number
  card: number | null
  card_data: { title: string; card_number: string } | null
  amount: number
  cost: number
  receipt: string | null
  notes: string
}

interface Vehicle {
  id: number
  registration_number: string
  vehicles_type_name: string
}

interface Driver {
  id: number
  full_name: string
}

interface Card {
  id: number
  title: string
  card_number: string
}

// Image Preview Dialog with Zoom
interface ImagePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  title: string
  altText?: string
  type: 'vehicle' | 'receipt'
}

const ImagePreviewDialog: React.FC<ImagePreviewDialogProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  altText = "Preview",
  type 
}) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMousePos = useRef({ x: 0, y: 0 })

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleZoomReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    lastMousePos.current = { x: e.clientX, y: e.clientY }
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || scale <= 1) return
    const deltaX = e.clientX - lastMousePos.current.x
    const deltaY = e.clientY - lastMousePos.current.y
    lastMousePos.current = { x: e.clientX, y: e.clientY }
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${type}_${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  useEffect(() => {
    if (isOpen) {
      handleZoomReset()
    }
  }, [isOpen])

  if (!imageUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[95vw] max-w-[95vw] p-0 overflow-y-auto ${isFullscreen ? 'w-screen h-screen max-w-none' : 'max-h-[90vh]'}`}>
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {type === 'vehicle' ? <Car className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
         
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-lg mb-4 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={scale >= 5}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={scale <= 0.5}
                    className="h-8 w-8 p-0"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate 90°</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomReset}
                    className="h-8 px-3"
                  >
                    Reset
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Zoom & Position</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 w-8 p-0"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {scale > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                <Move className="h-3 w-3" />
                <span>Drag to pan</span>
              </div>
            )}
          </div>

          {/* Image Container */}
          <div 
            ref={containerRef}
            className="flex-1 relative overflow-hidden bg-black/5 rounded-lg border"
            onMouseDown={handleMouseDown}
            style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={imageUrl}
                alt={altText}
                className="max-w-full max-h-full transition-transform duration-150 ease-out"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
                  transformOrigin: 'center',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = type === 'vehicle' 
                    ? "https://placehold.co/600x400?text=Vehicle+Image+Not+Found"
                    : "https://placehold.co/600x800?text=Receipt+Image+Not+Found"
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Multi-Image Preview Dialog for Receipts
interface MultiImagePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  imageUrls: string[]
  title: string
  type: 'receipt'
}

const MultiImagePreviewDialog: React.FC<MultiImagePreviewDialogProps> = ({
  isOpen,
  onClose,
  imageUrls,
  title,
  type
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : imageUrls.length - 1))
    setScale(1)
    setRotation(0)
  }

  const handleNext = () => {
    setCurrentIndex(prev => (prev < imageUrls.length - 1 ? prev + 1 : 0))
    setScale(1)
    setRotation(0)
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrls[currentIndex]
    link.download = `${type}_${currentIndex + 1}_${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
    }
  }, [isOpen, currentIndex])

  if (imageUrls.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title} ({currentIndex + 1}/{imageUrls.length})
            </DialogTitle>
            
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-4 flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-8 px-3"
              >
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-8 px-3"
              >
                Next
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 5}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <div className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-8 w-8 p-0"
              >
                <DownloadIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden bg-black/5 rounded-lg border flex items-center justify-center">
            <img
              src={imageUrls[currentIndex]}
              alt={`Receipt ${currentIndex + 1}`}
              className="max-w-full max-h-full transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "https://placehold.co/600x800?text=Receipt+Image+Not+Found"
              }}
            />
          </div>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {imageUrls.map((url, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border overflow-hidden ${
                    currentIndex === index ? 'ring-2 ring-primary border-primary' : 'border-border'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Updated ViewFuelLogDialog to use new preview dialogs
interface ViewFuelLogDialogProps {
  isOpen: boolean
  onClose: () => void
  log: FuelLog | null
}

const ViewFuelLogDialog: React.FC<ViewFuelLogDialogProps> = ({ isOpen, onClose, log }) => {
  const [showVehiclePreview, setShowVehiclePreview] = useState(false)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)

  if (!log) return null

  // Handle multiple receipts (comma-separated URLs)
  const receiptUrls = log.receipt ? log.receipt.split(',').map(url => url.trim()).filter(url => url) : []

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fuel Log Details</DialogTitle>
            <DialogDescription>View detailed information for fuel log ID: {log.id}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Vehicle:</span>
              <span className="col-span-3">
                {log.vehicle_data ? `${log.vehicle_data.registration_number} (${log.vehicle_data.vehicles_type_name})` : "N/A"}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Last Mileage:</span>
              <span className="col-span-3">{log.vehicle_data?.last_mileage || "N/A"} {log.vehicle_data?.mileage_unit}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Date & Time:</span>
              <span className="col-span-3">{formatDmy(log.date)} at {log.time}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Driver ID:</span>
              <span className="col-span-3">{log.driver}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Card:</span>
              <span className="col-span-3">
                {log.card_data?.title || "N/A"} ({log.card_data?.card_number || "N/A"})
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Fuel Amount:</span>
              <span className="col-span-3">{log.amount.toFixed(2)} Liters</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Cost:</span>
              <span className="col-span-3">£{log.cost.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium col-span-1">Notes:</span>
              <span className="col-span-3 whitespace-pre-wrap">{log.notes || "No notes"}</span>
            </div>
            
            {/* Vehicle Photo Section */}
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="font-medium col-span-1">Vehicle Photo:</span>
              <div className="col-span-3">
                {log.vehicle_photo ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowVehiclePreview(true)}
                        className="gap-2"
                      >
                        <ZoomIn className="h-4 w-4" />
                        Preview with Zoom
                      </Button>
                      <a
                        href={log.vehicle_photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2 text-sm"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Open in new tab
                      </a>
                    </div>
                    <div className="mt-2">
                      <img 
                        src={log.vehicle_photo} 
                        alt="Vehicle" 
                        className="max-w-full h-auto max-h-48 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setShowVehiclePreview(true)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "https://placehold.co/400x300?text=Vehicle+Image+Not+Found"
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No vehicle photo available</span>
                )}
              </div>
            </div>

            {/* Receipt Section */}
            <div className="grid grid-cols-4 items-start gap-4">
              <span className="font-medium col-span-1">Receipts:</span>
              <div className="col-span-3">
                {receiptUrls.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReceiptPreview(true)}
                        className="gap-2"
                      >
                        <ZoomIn className="h-4 w-4" />
                        Preview All Receipts ({receiptUrls.length})
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {receiptUrls.map((url, index) => (
                        <div key={index} className="space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Receipt #{index + 1}
                          </div>
                          <img 
                            src={url} 
                            alt={`Receipt ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowReceiptPreview(true)}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "https://placehold.co/400x300?text=Receipt+Not+Found"
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setShowReceiptPreview(true)}
                            >
                              Preview
                            </Button>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              Open
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No receipt available</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="rounded-lg">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vehicle Image Preview Dialog */}
      <ImagePreviewDialog
        isOpen={showVehiclePreview}
        onClose={() => setShowVehiclePreview(false)}
        imageUrl={log.vehicle_photo}
        title={`Vehicle Photo - ${log.vehicle_data?.registration_number || 'Unknown'}`}
        altText={`Vehicle photo for ${log.vehicle_data?.registration_number || 'Unknown'}`}
        type="vehicle"
      />

      {/* Receipt Image Preview Dialog */}
      {receiptUrls.length > 0 && (
        receiptUrls.length === 1 ? (
          <ImagePreviewDialog
            isOpen={showReceiptPreview}
            onClose={() => setShowReceiptPreview(false)}
            imageUrl={receiptUrls[0]}
            title={`Receipt - ${log.vehicle_data?.registration_number || 'Unknown'}`}
            altText="Fuel receipt"
            type="receipt"
          />
        ) : (
          <MultiImagePreviewDialog
            isOpen={showReceiptPreview}
            onClose={() => setShowReceiptPreview(false)}
            imageUrls={receiptUrls}
            title={`Receipts - ${log.vehicle_data?.registration_number || 'Unknown'}`}
            type="receipt"
          />
        )
      )}
    </>
  )
}

export default function FuelChecksManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [vehicleFilter, setVehicleFilter] = useState("")
  const [driverFilter, setDriverFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [cardFilter, setCardFilter] = useState("")
  const [fuelAmountFrom, setFuelAmountFrom] = useState("")
  const [fuelAmountTo, setFuelAmountTo] = useState("")
  const [fuelCostFrom, setFuelCostFrom] = useState("")
  const [fuelCostTo, setFuelCostTo] = useState("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editLog, setEditLog] = useState<FuelLog | null>(null)
  const [viewLog, setViewLog] = useState<FuelLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const cookies = useCookies()

  // State for image preview dialogs
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewImageType, setPreviewImageType] = useState<'vehicle' | 'receipt'>('vehicle')
  const [previewReceiptUrls, setPreviewReceiptUrls] = useState<string[]>([])
  const [showMultiPreview, setShowMultiPreview] = useState(false)

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setDrivers(data.data)
        } else {
          setError("Failed to fetch drivers")
        }
      } catch (err) {
        setError("An error occurred while fetching drivers")
      }
    }

    fetchDrivers()
  }, [cookies])

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/vehicles/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setVehicles(
            data.data.map((vehicle: any) => ({
              id: vehicle.id,
              registration_number: vehicle.registration_number,
              vehicles_type_name: vehicle.vehicle_type_name,
            })),
          )
        } else {
          setError("Failed to fetch vehicles")
        }
      } catch (err) {
        setError("An error occurred while fetching vehicles")
      }
    }

    fetchVehicles()
  }, [cookies])

  // Fetch cards
  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch(`${API_URL}/activity/card/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setCards(data.data)
        } else {
          setError("Failed to fetch cards")
        }
      } catch (err) {
        setError("An error occurred while fetching cards")
      }
    }

    fetchCards()
  }, [cookies])

  // Fetch fuel logs
  useEffect(() => {
    const fetchFuelLogs = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          ...(vehicleFilter && { vehicle: vehicleFilter }),
          ...(driverFilter && { driver: driverFilter }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          ...(cardFilter && { card: cardFilter }),
          ...(fuelAmountFrom && { amount_from: fuelAmountFrom }),
          ...(fuelAmountTo && { amount_to: fuelAmountTo }),
          ...(fuelCostFrom && { cost_from: fuelCostFrom }),
          ...(fuelCostTo && { cost_to: fuelCostTo }),
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })

        const response = await fetch(`${API_URL}/activity/fuel-log/?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setFuelLogs(data.data.results)
          setTotalCount(data.data.count)
        } else {
          setError("Failed to fetch fuel logs")
        }
      } catch (err) {
        setError("An error occurred while fetching fuel logs")
      } finally {
        setLoading(false)
      }
    }

    fetchFuelLogs()
  }, [
    currentPage,
    pageSize,
    vehicleFilter,
    driverFilter,
    dateFrom,
    dateTo,
    cardFilter,
    fuelAmountFrom,
    fuelAmountTo,
    fuelCostFrom,
    fuelCostTo,
    cookies,
  ])

  const handleAddFuelLog = (newLog: FuelLog) => {
    setFuelLogs((prev) => [newLog, ...prev])
    setIsAddDialogOpen(false)
  }

  const handleEditFuelLog = (updatedLog: FuelLog) => {
    setFuelLogs((prev) => prev.map((log) => (log.id === updatedLog.id ? updatedLog : log)))
    setIsAddDialogOpen(false)
    setEditLog(null)
  }

  const handleDeleteFuelLog = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/activity/fuel-log/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (response.ok) {
        setFuelLogs((prev) => prev.filter((log) => log.id !== id))
      } else {
        setError("Failed to delete fuel log")
      }
    } catch (err) {
      setError("An error occurred while deleting fuel log")
    }
  }

  // Function to open vehicle image preview
  const openVehicleImagePreview = (imageUrl: string, vehicleName: string) => {
    setPreviewImageUrl(imageUrl)
    setPreviewImageType('vehicle')
    setPreviewImageUrl(imageUrl)
    setShowImagePreview(true)
  }

  // Function to open receipt image preview
  const openReceiptImagePreview = (receiptField: string, vehicleName: string) => {
    const receiptUrls = receiptField.split(',').map(url => url.trim()).filter(url => url)
    if (receiptUrls.length === 0) return
    
    if (receiptUrls.length === 1) {
      setPreviewImageUrl(receiptUrls[0])
      setPreviewImageType('receipt')
      setShowImagePreview(true)
    } else {
      setPreviewReceiptUrls(receiptUrls)
      setShowMultiPreview(true)
    }
  }

  const filteredData = fuelLogs.filter(
    (log) =>
      log?.vehicle_data?.registration_number?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(totalCount / pageSize)

  const clearAllFilters = () => {
    setSearchTerm("")
    setVehicleFilter("")
    setDriverFilter("")
    setDateFrom("")
    setDateTo("")
    setCardFilter("")
    setFuelAmountFrom("")
    setFuelAmountTo("")
    setFuelCostFrom("")
    setFuelCostTo("")
    setCurrentPage(1)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchTerm) count++
    if (vehicleFilter) count++
    if (driverFilter) count++
    if (dateFrom) count++
    if (dateTo) count++
    if (cardFilter) count++
    if (fuelAmountFrom) count++
    if (fuelAmountTo) count++
    if (fuelCostFrom) count++
    if (fuelCostTo) count++
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading fuel logs...</span>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="p-6 flex items-center gap-4 border-red-200">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Error</h3>
            <p className="text-red-500">{error}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Fuel Checks Management</h1>
            <p className="text-lg text-muted-foreground">Track and manage fuel logs for fleet compliance</p>
          </div>

          <Card className="">
            <div className="p-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute z-5 left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-11 gap-2 rounded-lg relative"
                  >
                    <Filter className="h-5 w-5" />
                    Filters
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ExportButton data={fuelLogs} fileName="fuel_logs.csv" />
                    </TooltipTrigger>
                    <TooltipContent>Export fuel logs to CSV</TooltipContent>
                  </Tooltip>

                  <GradientButton
                    text="Add Fuel Log"
                    Icon={Plus}
                    onClick={() => {
                      setEditLog(null)
                      setIsAddDialogOpen(true)
                    }}
                  />
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-6 bg-muted/20 border-b border-border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter Options
                    </h3>
                    {getActiveFiltersCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-4">
                    {/* Date From */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Date From
                      </label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Date To
                      </label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Fuel Amount From */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Fuel Amount From
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fuelAmountFrom}
                        onChange={(e) => setFuelAmountFrom(e.target.value)}
                        placeholder="Liters"
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Fuel Amount To */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Fuel Amount To
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fuelAmountTo}
                        onChange={(e) => setFuelAmountTo(e.target.value)}
                        placeholder="Liters"
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Fuel Cost From */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Fuel Cost From
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fuelCostFrom}
                        onChange={(e) => setFuelCostFrom(e.target.value)}
                        placeholder="£"
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Fuel Cost To */}
                    <div className="flex flex-col w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Fuel Cost To
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fuelCostTo}
                        onChange={(e) => setFuelCostTo(e.target.value)}
                        placeholder="£"
                        className="h-10 rounded-lg"
                      />
                    </div>

                    {/* Vehicle */}
                    <div className="flex flex-col w-[200px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Vehicle
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
                            {vehicleFilter
                              ? vehicles.find((v) => v.id.toString() === vehicleFilter)?.registration_number ||
                                "Select Vehicle"
                              : "Select Vehicle"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setVehicleFilter("")}>
                            All Vehicles
                          </DropdownMenuItem>
                          {vehicles.map((vehicle) => (
                            <DropdownMenuItem
                              key={vehicle.id}
                              onClick={() => setVehicleFilter(vehicle.id.toString())}
                            >
                              {vehicle.registration_number} ({vehicle.vehicles_type_name})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Driver */}
                    <div className="flex flex-col w-[250px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Driver
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
                            {driverFilter
                              ? drivers.find((d) => d.id.toString() === driverFilter)?.full_name || "Select Driver"
                              : "Select Driver"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setDriverFilter("")}>
                            All Drivers
                          </DropdownMenuItem>
                          {drivers.map((driver) => (
                            <DropdownMenuItem
                              key={driver.id}
                              onClick={() => setDriverFilter(driver.id.toString())}
                            >
                              {driver.full_name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Card */}
                    <div className="flex flex-col w-[200px]">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Card
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
                            {cardFilter
                              ? cards.find((c) => c.id.toString() === cardFilter)?.title || "Select Card"
                              : "Select Card"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setCardFilter("")}>
                            All Cards
                          </DropdownMenuItem>
                          {cards.map((card) => (
                            <DropdownMenuItem
                              key={card.id}
                              onClick={() => setCardFilter(card.id.toString())}
                            >
                              {card.title || "Untitled"} ({card.card_number})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {getActiveFiltersCount() > 0 && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                        {searchTerm && (
                          <Badge variant="secondary" className="gap-1">
                            Search: {searchTerm}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                          </Badge>
                        )}
                        {vehicleFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Vehicle:{" "}
                            {vehicles.find((v) => v.id.toString() === vehicleFilter)?.registration_number ||
                              vehicleFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setVehicleFilter("")} />
                          </Badge>
                        )}
                        {driverFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Driver: {drivers.find((d) => d.id.toString() === driverFilter)?.full_name || driverFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDriverFilter("")} />
                          </Badge>
                        )}
                        {dateFrom && (
                          <Badge variant="secondary" className="gap-1">
                            Date From: {dateFrom}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFrom("")} />
                          </Badge>
                        )}
                        {dateTo && (
                          <Badge variant="secondary" className="gap-1">
                            Date To: {dateTo}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setDateTo("")} />
                          </Badge>
                        )}
                        {cardFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Card: {cards.find((c) => c.id.toString() === cardFilter)?.title || cardFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setCardFilter("")} />
                          </Badge>
                        )}
                        {fuelAmountFrom && (
                          <Badge variant="secondary" className="gap-1">
                            Amount From: {fuelAmountFrom} L
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setFuelAmountFrom("")} />
                          </Badge>
                        )}
                        {fuelAmountTo && (
                          <Badge variant="secondary" className="gap-1">
                            Amount To: {fuelAmountTo} L
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setFuelAmountTo("")} />
                          </Badge>
                        )}
                        {fuelCostFrom && (
                          <Badge variant="secondary" className="gap-1">
                            Cost From: £{fuelCostFrom}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setFuelCostFrom("")} />
                          </Badge>
                        )}
                        {fuelCostTo && (
                          <Badge variant="secondary" className="gap-1">
                            Cost To: £{fuelCostTo}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setFuelCostTo("")} />
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold py-4">Log ID</TableHead>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                  <TableHead className="font-semibold text-center">Amount (Liters)</TableHead>
                  <TableHead className="font-semibold text-center">Cost (£)</TableHead>
                  <TableHead className="font-semibold">Card Used</TableHead>
                  <TableHead className="font-semibold">Notes</TableHead>
                  <TableHead className="font-semibold text-center">Vehicle Photo</TableHead>
                  <TableHead className="font-semibold text-center">Receipt</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((log) => {
                  const receiptUrls = log.receipt ? log.receipt.split(',').map(url => url.trim()).filter(url => url) : []
                  
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{log.id}</TableCell>
                      <TableCell>
                        {log.vehicle_data?.registration_number || "N/A"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {log.vehicle_data?.vehicles_type_name || ""}
                        </span>
                      </TableCell>
                      <TableCell>{formatDmy(log.date)}</TableCell>
                      <TableCell>{log.time}</TableCell>
                      <TableCell className="text-center">{log.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-center">£{log.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {log.card_data?.title || "N/A"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {log.card_data?.card_number || ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={log.notes}>
                          {log.notes || "No notes"}
                        </div>
                      </TableCell>
                      
                      {/* Vehicle Photo Column */}
                      <TableCell className="text-center">
                        {log.vehicle_photo ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openVehicleImagePreview(
                                  log.vehicle_photo!,
                                  log.vehicle_data?.registration_number || 'Unknown'
                                )}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Preview Vehicle Photo
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      
                      {/* Receipt Column */}
                      <TableCell className="text-center">
                        {receiptUrls.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openReceiptImagePreview(
                                    log.receipt!,
                                    log.vehicle_data?.registration_number || 'Unknown'
                                  )}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {receiptUrls.length > 1 && (
                                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                                    {receiptUrls.length}
                                  </Badge>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Preview Receipt{receiptUrls.length > 1 ? 's' : ''}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                                  <MoreHorizontal className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>More actions</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setViewLog(log)
                                setIsViewDialogOpen(true)
                              }}
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditLog(log)
                                setIsAddDialogOpen(true)
                              }}
                              className="flex items-center gap-2"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteFuelLog(log.id)}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <select
                  className="border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-lg gap-2"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </Button>

                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-9 w-9 rounded-lg p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-3 py-2 text-muted-foreground">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-9 w-9 rounded-lg p-0 bg-transparent"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-lg gap-2"
                >
                  Next
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>

          <AddFuelLogDialog
            isOpen={isAddDialogOpen}
            onClose={() => {
              setIsAddDialogOpen(false)
              setEditLog(null)
            }}
            onAdd={(log) => {
              if (editLog) {
                // Ensure vehicle_data is present for edit
                handleEditFuelLog({
                  ...log,
                  vehicle: typeof log.vehicle === "object" && log.vehicle !== null
                    ? log.vehicle.id
                    : log.vehicle ?? editLog.vehicle,
                  vehicle_data: log.vehicle_data ?? editLog.vehicle_data,
                })
              } else {
                handleAddFuelLog({
                  ...log,
                  vehicle: typeof log.vehicle === "object" && log.vehicle !== null
                    ? log.vehicle.id
                    : log.vehicle ?? 0, // fallback to 0 if null
                })
              }
            }}
            initialData={
              editLog
                ? {
                    ...editLog,
                    vehicle: editLog.vehicle_data
                      ? {
                          id: editLog.vehicle_data.id,
                          registration_number: editLog.vehicle_data.registration_number,
                          vehicles_type_name: editLog.vehicle_data.vehicles_type_name,
                          last_mileage: editLog.vehicle_data.last_mileage,
                          site_allocated:
                            Array.isArray(editLog.vehicle_data.site_allocated) && editLog.vehicle_data.site_allocated.length > 0
                              ? editLog.vehicle_data.site_allocated[0]
                              : null,
                        }
                      : null,
                  }
                : undefined
            }
            vehicles={vehicles}
            drivers={drivers}
            cards={cards}
          />

          <ViewFuelLogDialog isOpen={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} log={viewLog} />

          {/* Single Image Preview Dialog */}
          <ImagePreviewDialog
            isOpen={showImagePreview}
            onClose={() => setShowImagePreview(false)}
            imageUrl={previewImageUrl}
            title={`${previewImageType === 'vehicle' ? 'Vehicle Photo' : 'Receipt'} Preview`}
            type={previewImageType}
          />

          {/* Multi-Image Preview Dialog */}
          <MultiImagePreviewDialog
            isOpen={showMultiPreview}
            onClose={() => setShowMultiPreview(false)}
            imageUrls={previewReceiptUrls}
            title="Receipts Preview"
            type="receipt"
          />
        </div>
      </div>
    </TooltipProvider>
  )
}