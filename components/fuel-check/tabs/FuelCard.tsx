"use client"

import { formatDmy } from "@/lib/utils"

import type React from "react"
import { useState, useEffect } from "react"
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
  Trash,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CreditCard,
  ChevronDown,
  EyeOff,
  CheckCircle2,
} from "lucide-react"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Loader2, AlertCircle } from "lucide-react"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ExportButton from "@/app/utils/ExportButton"

interface Card {
  id: number
  title: string | null
  card_number: string
  expiry_date: string
  pin: number
  is_active: boolean
}

interface ViewCardDialogProps {
  isOpen: boolean
  onClose: () => void
  card: Card | null
}

interface AddCardDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (newCard: Card) => void
}

const ViewCardDialog: React.FC<ViewCardDialogProps> = ({ isOpen, onClose, card }) => {
  if (!card) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-lg">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
          <DialogDescription>View detailed information for card ID: {card.id}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Title:</span>
            <span className="col-span-3">{card.title || "N/A"}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Card Number:</span>
            <span className="col-span-3">{card.card_number}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Expiry Date:</span>
            <span className="col-span-3">{formatDmy(card.expiry_date)}</span>
          </div>
          {(() => {
            const cookies = useCookies();
            const role = cookies.get('role');
            return role === 'superadmin' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium col-span-1">PIN:</span>
                <span className="col-span-3">{card.pin}</span>
              </div>
            );
          })()}
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium col-span-1">Status:</span>
            <span className="col-span-3">
              <Badge>
                {card.is_active ? "Active" : "Inactive"}
              </Badge>
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-lg bg-transparent">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const detectCardType = (number: string) => {
  const cleaned = number.replace(/\s/g, "")
  if (cleaned.startsWith("4")) return "Visa"
  if (cleaned.startsWith("5") || cleaned.startsWith("2")) return "Mastercard"
  if (cleaned.startsWith("3")) return "Amex"
  return "Unknown"
}

const formatCardNumber = (value: string) => {
  const cleaned = value.replace(/\s/g, "")
  const match = cleaned.match(/.{1,4}/g)
  return match ? match.join(" ") : cleaned
}

const formatExpiryDate = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + (cleaned.length > 2 ? "/" + cleaned.substring(2, 4) : "")
  }
  return cleaned
}

const AddCardDialog: React.FC<AddCardDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const cookies = useCookies()

  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors }

    switch (field) {
      case "cardNumber":
        const cleaned = value.replace(/\s/g, "")
        if (cleaned.length < 13 || cleaned.length > 19) {
          errors.cardNumber = "Card number must be 13-19 digits"
        } else if (!/^\d+$/.test(cleaned)) {
          errors.cardNumber = "Card number must contain only digits"
        } else {
          delete errors.cardNumber
        }
        break
      case "expiryDate":
        if (!/^\d{2}\/\d{2}$/.test(value)) {
          errors.expiryDate = "Use MM/YY format"
        } else {
          const [month, year] = value.split("/")
          const currentDate = new Date()
          const currentYear = currentDate.getFullYear() % 100
          const currentMonth = currentDate.getMonth() + 1

          if (Number.parseInt(month) < 1 || Number.parseInt(month) > 12) {
            errors.expiryDate = "Invalid month"
          } else if (
            Number.parseInt(year) < currentYear ||
            (Number.parseInt(year) === currentYear && Number.parseInt(month) < currentMonth)
          ) {
            errors.expiryDate = "Card has expired"
          } else {
            delete errors.expiryDate
          }
        }
        break
      case "pin":
        if (value.length !== 4) {
          errors.pin = "PIN must be 4 digits"
        } else if (!/^\d{4}$/.test(value)) {
          errors.pin = "PIN must contain only digits"
        } else {
          delete errors.pin
        }
        break
    }

    setFieldErrors(errors)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    if (formatted.replace(/\s/g, "").length <= 19) {
      setCardNumber(formatted)
      validateField("cardNumber", formatted)
    }
  }

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value)
    if (formatted.length <= 5) {
      setExpiryDate(formatted)
      validateField("expiryDate", formatted)
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    if (value.length <= 4) {
      setPin(value)
      validateField("pin", value)
    }
  }

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {}

    if (!cardNumber.trim()) newErrors.cardNumber = "Card number is required"
    if (!expiryDate.trim()) newErrors.expiryDate = "Expiry date is required"
    if (!pin.trim()) newErrors.pin = "PIN is required"

    validateField("cardNumber", cardNumber)
    validateField("expiryDate", expiryDate)
    validateField("pin", pin)

    if (Object.keys(fieldErrors).length > 0 || Object.keys(newErrors).length > 0) {
      setFieldErrors({ ...fieldErrors, ...newErrors })
      setError("Please fix the errors above")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [month, year] = expiryDate.split("/")
      const fullYear = 2000 + Number.parseInt(year)
      const expiryDateISO = new Date(fullYear, Number.parseInt(month) - 1, 1).toISOString()

      const response = await fetch(`${API_URL}/activity/card/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
        body: JSON.stringify([{
          title: title || null,
          card_number: cardNumber.replace(/\s/g, ""),
          expiry_date: expiryDateISO,
          pin: Number(pin),
        }]),
      })

      if (response.ok) {
        const newCard = await response.json()
        onAdd(newCard.data)
        setTitle("")
        setCardNumber("")
        setExpiryDate("")
        setPin("")
        setError(null)
        setFieldErrors({})
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.message || "Failed to add card")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setCardNumber("")
    setExpiryDate("")
    setPin("")
    setError(null)
    setFieldErrors({})
    onClose()
  }

  const cardType = detectCardType(cardNumber)
  const isFormValid = cardNumber && expiryDate && pin && Object.keys(fieldErrors).length === 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0">
        <div className="p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Add Payment Card
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your card details securely. All information is encrypted and protected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Card Name (Optional)
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Personal Card, Business Card"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber" className="text-sm font-medium">
                Card Number *
              </Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className={`h-11 pr-12 ${fieldErrors.cardNumber ? "border-destructive" : ""}`}
                />
                {cardType !== "Unknown" && cardNumber.length > 8 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              {fieldErrors.cardNumber && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.cardNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-sm font-medium">
                  Expiry Date *
                </Label>
                <Input
                  id="expiryDate"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                  placeholder="MM/YY"
                  className={`h-11 ${fieldErrors.expiryDate ? "border-destructive" : ""}`}
                />
                {fieldErrors.expiryDate && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.expiryDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium">
                  PIN *
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="••••"
                    className={`h-11 pr-10 ${fieldErrors.pin ? "border-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {fieldErrors.pin && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.pin}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="border-t bg-muted/30 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="min-w-[80px] bg-transparent">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !isFormValid} className="min-w-[100px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CardManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [cardTypeFilter, setCardTypeFilter] = useState<string>("")
  const [expiryStartDate, setExpiryStartDate] = useState<string>("")
  const [expiryEndDate, setExpiryEndDate] = useState<string>("")
  const [cards, setCards] = useState<Card[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewCard, setViewCard] = useState<Card | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const cookies = useCookies()
  const role = cookies.get('role')

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
          ...(statusFilter && { is_active: statusFilter }),
        })

        const response = await fetch(`${API_URL}/activity/card/?${queryParams}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        const data = await response.json()
        if (data.success) {
          setCards(data.data)
          setTotalCount(data.data.length)
        } else {
          setError("Failed to fetch cards")
        }
      } catch (err) {
        setError("An error occurred while fetching cards")
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [currentPage, pageSize, statusFilter, cookies])

  const handleDeleteCard = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/activity/card/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })
      if (response.ok) {
        setCards((prev) => prev.filter((card) => card.id !== id))
      } else {
        setError("Failed to delete card")
      }
    } catch (err) {
      setError("An error occurred while deleting card")
    }
  }

  const handleAddCard = (newCard: Card) => {
    setCards((prev) => [...prev, newCard])
    setTotalCount((prev) => prev + 1)
  }

  const filteredData = cards.filter((card) => {
    const matchesSearch =
      card?.card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card?.title && card.title?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter ? card.is_active.toString() === statusFilter : true

    const matchesCardType = cardTypeFilter
      ? detectCardType(card.card_number) === cardTypeFilter
      : true

    const cardExpiryDate = new Date(card.expiry_date)
    const matchesExpiryRange =
      (!expiryStartDate || cardExpiryDate >= new Date(expiryStartDate)) &&
      (!expiryEndDate || cardExpiryDate <= new Date(expiryEndDate))

    return matchesSearch && matchesStatus && matchesCardType && matchesExpiryRange
  })

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const clearAllFilters = () => {
    setSearchTerm("")
    setStatusFilter("")
    setCardTypeFilter("")
    setExpiryStartDate("")
    setExpiryEndDate("")
    setCurrentPage(1)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchTerm) count++
    if (statusFilter) count++
    if (cardTypeFilter) count++
    if (expiryStartDate || expiryEndDate) count++
    return count
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg text-foreground">Loading cards...</span>
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
            <h1 className="text-4xl font-bold text-foreground tracking-tight">Card Management</h1>
            <p className="text-lg text-muted-foreground">Manage payment cards for fleet operations</p>
          </div>

          <Card className="">
            <div className="p-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute z-5 left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by card number or title..."
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
                      <ExportButton data={filteredData} fileName="cards.csv" />
                    </TooltipTrigger>
                    <TooltipContent>Export cards to CSV</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(true)}
                        className="h-11 gap-2 text-white rounded-lg bg-orange"
                      >
                        <Plus className="h-5 w-5" />
                        Add Card
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add a new payment card</TooltipContent>
                  </Tooltip>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Card Status
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
                            {statusFilter
                              ? statusFilter === "true"
                                ? "Active"
                                : "Inactive"
                              : "Select Status"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setStatusFilter("")}>
                            All Statuses
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("true")}>
                            Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStatusFilter("false")}>
                            Inactive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Card Type
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full h-10 justify-between rounded-lg">
                            {cardTypeFilter || "Select Card Type"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full">
                          <DropdownMenuItem onClick={() => setCardTypeFilter("")}>
                            All Types
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCardTypeFilter("Visa")}>
                            Visa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCardTypeFilter("Mastercard")}>
                            Mastercard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCardTypeFilter("Amex")}>
                            Amex
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCardTypeFilter("Unknown")}>
                            Unknown
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Expiry Date Range
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={expiryStartDate}
                          onChange={(e) => setExpiryStartDate(e.target.value)}
                          placeholder="Start Date"
                          className="h-10"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="date"
                          value={expiryEndDate}
                          onChange={(e) => setExpiryEndDate(e.target.value)}
                          placeholder="End Date"
                          className="h-10"
                        />
                      </div>
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
                        {statusFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Status: {statusFilter === "true" ? "Active" : "Inactive"}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("")} />
                          </Badge>
                        )}
                        {cardTypeFilter && (
                          <Badge variant="secondary" className="gap-1">
                            Card Type: {cardTypeFilter}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => setCardTypeFilter("")} />
                          </Badge>
                        )}
                        {(expiryStartDate || expiryEndDate) && (
                          <Badge variant="secondary" className="gap-1">
                            Expiry: {expiryStartDate || "Any"} - {expiryEndDate || "Any"}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setExpiryStartDate("")
                                setExpiryEndDate("")
                              }}
                            />
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
                  <TableHead className="font-semibold py-4">Card ID</TableHead>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Card Number</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  {role === 'superadmin' && (
                    <TableHead className="font-semibold text-center">PIN</TableHead>
                  )}
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((card) => (
                  <TableRow key={card.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{card.id}</TableCell>
                    <TableCell>{card.title || "N/A"}</TableCell>
                    <TableCell>{card.card_number}</TableCell>
                    <TableCell>{formatDmy(card.expiry_date)}</TableCell>
                    {role === 'superadmin' && (
                      <TableCell className="text-center">{card.pin}</TableCell>
                    )}
                    <TableCell className="text-center">
                      <Badge>
                        {card.is_active ? "Active" : "Inactive"}
                      </Badge>
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
                              setViewCard(card)
                              setIsViewDialogOpen(true)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCard(card.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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

          <ViewCardDialog isOpen={isViewDialogOpen} onClose={() => setIsViewDialogOpen(false)} card={viewCard} />
          <AddCardDialog
            isOpen={isAddDialogOpen}
            onClose={() => setIsAddDialogOpen(false)}
            onAdd={handleAddCard}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}