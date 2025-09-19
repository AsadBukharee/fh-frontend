"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search, Filter, Loader2, Calendar, Wrench, Download, Shield, Settings, Circle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { parse, differenceInDays, format } from "date-fns"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

interface ApiResponse {
  success: boolean
  message: string
  data: {
    mot: Array<{
      vehicle_reg: string
      mot_expiry: string
      next_mot_booked_from: string | null
      next_mot_booked_date: string | null
      time_mot_booked: string
      last_inspection_date: string
      next_inspection_booked_before: string
    }>
    pmi: Array<{
      vehicle_reg: string
      next_inspection_book_date: string
      last_inspection_date?: string
      next_inspection_status?: string
    }>
    tacho: Array<{
      vehicle_reg: string
      last_download: string | null
      next_download: string | null
    }>
    tyre: Array<{
      vehicle_reg: string
      last_check: string | null
      next_check: string | null
    }>
    insurance: Array<{
      vehicle_reg: string
      expiry: string
    }>
    calibrations: Array<{
      vehicle_reg: string
      expiry: string
    }>
  }
}

interface Vehicle {
  vehicle_reg: string
  type?: string // For vehicle type filtering
  // MOT fields
  mot_expiry?: string
  next_mot_booked_from?: string | null
  next_mot_booked_date?: string | null
  time_mot_booked?: string
  last_inspection_date?: string
  next_inspection_booked_before?: string
  // PMI fields
  next_inspection_book_date?: string
  pmi_last_inspection_date?: string
  pmi_next_inspection_status?: string
  // Tacho fields
  last_download?: string | null
  next_download?: string | null
  // Tyre fields
  last_check?: string | null
  next_check?: string | null
  // Insurance/Calibrations common
  expiry?: string
}

export default function VehicleDashboard() {
  const [fullApiData, setFullApiData] = useState<ApiResponse | null>(null)
  const [filteredData, setFilteredData] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("All Data")
  const [vehicleType, setVehicleType] = useState("All Vehicles")
  const cookies = useCookies()
  const perPage = 10

  // Date helpers
  const parseFlexibleDate = (input?: string | null): Date | null => {
    if (!input) return null
    const trimmed = String(input).trim()
    try {
      const dmy = parse(trimmed, "dd/MM/yyyy", new Date())
      if (!isNaN(dmy.getTime()) && /\d{2}\/\d{2}\/\d{4}/.test(trimmed)) return dmy
    } catch {}
    const candidateFormats = [
      "yyyy-MM-dd'T'HH:mm:ssXXX",
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
      "yyyy-MM-dd'T'HH:mm:ss'Z'",
      "yyyy-MM-dd",
      "dd-MM-yyyy",
      "MM/dd/yyyy",
    ]
    for (const fmt of candidateFormats) {
      try {
        const dt = parse(trimmed, fmt, new Date())
        if (!isNaN(dt.getTime())) return dt
      } catch {}
    }
    const dt = new Date(trimmed)
    return isNaN(dt.getTime()) ? null : dt
  }

  const formatDateDmy = (input?: string | null): string => {
    const dt = parseFlexibleDate(input)
    return dt ? format(dt, "dd/MM/yyyy") : input ?? "-"
  }

  const filterOptions = [
    { key: "All Data", label: "All Data", icon: null },
    { key: "MOT", label: "MOT", icon: Calendar },
    { key: "PMI Inspection", label: "PMI Inspection", icon: Wrench },
    { key: "Vehicle Tacho Download", label: "Vehicle Tacho Download", icon: Download },
    { key: "Tyre Maintenance Check", label: "Tyre Maintenance Check", icon: Circle },
    { key: "Insurance & Check", label: "Insurance & Check", icon: Shield },
    { key: "Calibrations", label: "Calibrations", icon: Settings },
  ]

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/vehicles/compliance/`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cookies.get("access_token")}`, },
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data: ApiResponse = await response.json()
      setFullApiData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching vehicle data")
    } finally {
      setLoading(false)
    }
  }, [cookies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDataForActiveFilter = useCallback((): Vehicle[] => {
    if (!fullApiData) return [] as Vehicle[]

    const deduplicateByLatest = <T extends { vehicle_reg: string; mot_expiry?: string }>(
      items: T[]
    ): T[] => {
      const map = new Map<string, T>()
      items.forEach((item) => {
        const existing = map.get(item.vehicle_reg)
        if (
          !existing ||
          (item.mot_expiry &&
            existing.mot_expiry &&
            parse(item.mot_expiry, "dd/MM/yyyy", new Date()) >
              parse(existing.mot_expiry, "dd/MM/yyyy", new Date()))
        ) {
          map.set(item.vehicle_reg, item)
        }
      })
      return Array.from(map.values())
    }

    switch (activeFilter) {
      case "All Data":
        const allVehicles = new Set<string>()
        Object.values(fullApiData.data).forEach((dataArray) => {
          dataArray.forEach((item) => allVehicles.add(item.vehicle_reg))
        })
        return Array.from(allVehicles).map((reg) => ({
          vehicle_reg: reg,
          type: reg.includes("VAN") ? "16-Seater MK7" : "16-Seater MK8",
        })) as Vehicle[]
      case "MOT":
        return deduplicateByLatest(fullApiData.data.mot).map((i) => ({ ...i })) as Vehicle[]
      case "PMI Inspection":
        return deduplicateByLatest(fullApiData.data.pmi).map((i) => ({
          ...i,
          pmi_last_inspection_date: i.last_inspection_date,
          pmi_next_inspection_status: i.next_inspection_status,
        })) as Vehicle[]
      case "Vehicle Tacho Download":
        return deduplicateByLatest(fullApiData.data.tacho).map((i) => ({ ...i })) as Vehicle[]
      case "Tyre Maintenance Check":
        return deduplicateByLatest(fullApiData.data.tyre).map((i) => ({ ...i })) as Vehicle[]
      case "Insurance & Check":
        return deduplicateByLatest(fullApiData.data.insurance).map((i) => ({ ...i })) as Vehicle[]
      case "Calibrations":
        return deduplicateByLatest(fullApiData.data.calibrations).map((i) => ({ ...i })) as Vehicle[]
      default:
        return [] as Vehicle[]
    }
  }, [fullApiData, activeFilter])

  useEffect(() => {
    let data = getDataForActiveFilter()
    if (searchQuery) {
      data = data.filter((d) => d.vehicle_reg.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    if (vehicleType !== "All Vehicles") {
      data = data.filter((d) => d.type === vehicleType)
    }
    setFilteredData(data)
    setTotalPages(Math.ceil(data.length / perPage))
    setCurrentPage(1)
  }, [getDataForActiveFilter, searchQuery, vehicleType, perPage])

  const getStatusBadge = (status?: string | null, expiry?: string) => {
    if (!status && !expiry) return <span className="text-gray-400">-</span>

    if (expiry) {
      try {
        const parsed = parseFlexibleDate(expiry)
        const expiryDate = parsed ?? parse(expiry, "dd/MM/yyyy", new Date())
        const today = new Date("2025-09-19T14:41:00") // Current date: September 19, 2025, 02:41 PM PKT
        const daysDiff = differenceInDays(today, expiryDate)
        if (daysDiff > 0) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
                  title={`Expired ${daysDiff} days ago as of ${format(today, "dd/MM/yyyy HH:mm")} PKT`}>
              Expired {daysDiff} days ago
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                title={`${Math.abs(daysDiff)} days remaining until ${format(expiryDate, "dd/MM/yyyy")} PKT`}>
            {formatDateDmy(expiry)}
          </span>
        )
      } catch {
        return <span className="text-gray-900">{formatDateDmy(expiry)}</span>
      }
    }

    if (typeof status === "string" && status.includes("Expired")) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800"
              title={`Status: ${status} as of ${format(new Date(), "dd/MM/yyyy HH:mm")} PKT`}>
          {status}
        </span>
      )
    }
    if (status === "Booked") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
              title={`Booked as of ${format(new Date(), "dd/MM/yyyy HH:mm")} PKT`}>
          Booked
        </span>
      )
    }
    if (status === "TBC") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800"
              title={`To Be Confirmed as of ${format(new Date(), "dd/MM/yyyy HH:mm")} PKT`}>
          TBC
        </span>
      )
    }
    return <span className="text-gray-900">{status}</span>
  }

  const renderTableHeaders = () => {
    switch (activeFilter) {
      case "All Data":
        return (
          <>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0 z-10">Vehicle Reg</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-orange-500/30 border-r border-orange-600" colSpan={6}>MOT</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-pink-400 border-r border-pink-500/30" colSpan={3}>PMI Inspections</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-blue-500/30 border-r border-blue-600" colSpan={2}>Tacho Download</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-purple-500/30 border-r border-purple-600" colSpan={2}>Tyre Maintenance</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-green-500/30 border-r border-green-600" colSpan={1}>Insurance & Tax</th>
              <th className="text-center p-3 text-sm font-medium text-white bg-yellow-500/30" colSpan={1}>Calibrations</th>
            </tr>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 text-xs font-medium text-gray-600 sticky left-0 z-10 bg-gray-50"></th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[120px]">MOT Expiry</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[140px]">Next MOT Booked From</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[140px]">Next MOT Booked Date</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[120px]">Time MOT Booked</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[130px]">Last Inspec Date</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[160px]">Next Inspec Status</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[150px]">Last Inspection Date</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[150px]">Next Inspection Status</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[130px]">Last Download</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[130px]">Next Download</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[120px]">Last Check</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[120px]">Next Check</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 border-r border-gray-200 min-w-[130px]">Insurance Expiry</th>
              <th className="text-left p-2 text-xs font-medium text-gray-900 min-w-[140px]">Calibration Expiry</th>
            </tr>
          </>
        )
      case "MOT":
        return (
          <tr className="border-b border-gray-200 bg-orange-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">MOT Expiry</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next MOT Booked From</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next MOT Booked Date</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Time MOT Booked</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Inspection Date</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Inspection Status</th>
          </tr>
        )
      case "PMI Inspection":
        return (
          <tr className="border-b border-gray-200 bg-pink-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Inspection Book Date</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Inspection Date</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Inspection Status</th>
          </tr>
        )
      case "Vehicle Tacho Download":
        return (
          <tr className="border-b border-gray-200 bg-blue-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Download</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Download</th>
          </tr>
        )
      case "Tyre Maintenance Check":
        return (
          <tr className="border-b border-gray-200 bg-purple-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Last Check</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Next Check</th>
          </tr>
        )
      case "Insurance & Check":
        return (
          <tr className="border-b border-gray-200 bg-green-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Insurance Expiry</th>
          </tr>
        )
      case "Calibrations":
        return (
          <tr className="border-b border-gray-200 bg-yellow-50">
            <th className="text-left p-3 text-sm font-medium text-gray-900">Vehicle Reg</th>
            <th className="text-left p-3 text-sm font-medium text-gray-900">Calibration Expiry</th>
          </tr>
        )
      default:
        return null
    }
  }

  const getVehicleData = (vehicleReg: string) => {
    if (!fullApiData) return null
    return {
      mot: fullApiData.data.mot.find((item) => item.vehicle_reg === vehicleReg),
      pmi: fullApiData.data.pmi.find((item) => item.vehicle_reg === vehicleReg),
      tacho: fullApiData.data.tacho.find((item) => item.vehicle_reg === vehicleReg),
      tyre: fullApiData.data.tyre.find((item) => item.vehicle_reg === vehicleReg),
      insurance: fullApiData.data.insurance.find((item) => item.vehicle_reg === vehicleReg),
      calibrations: fullApiData.data.calibrations.find((item) => item.vehicle_reg === vehicleReg),
    }
  }

  const renderTableRow = (item: Vehicle, index: number) => {
    const vehicleData = getVehicleData(item.vehicle_reg)
    const motData = vehicleData?.mot
    const pmiData = vehicleData?.pmi
    const today = new Date("2025-09-19T14:41:00") // Current date: September 19, 2025, 02:41 PM PKT
    let motExpiryTooltip = ""
    let pmiLastInspectionTooltip = ""
    let pmiNextInspectionTooltip = ""

    // Tooltip for MOT Expiry
    if (motData?.mot_expiry) {
      const expiryDate = parseFlexibleDate(motData.mot_expiry)
      if (expiryDate) {
        const daysDiff = differenceInDays(expiryDate, today)
        motExpiryTooltip = daysDiff > 0 ? `${daysDiff} days left to start book` : `Expired ${Math.abs(daysDiff)} days ago`
      }
    }

    // Tooltip for PMI Last Inspection Date
    if (pmiData?.last_inspection_date) {
      const lastInspectionDate = parseFlexibleDate(pmiData.last_inspection_date)
      if (lastInspectionDate) {
        const daysSince = differenceInDays(today, lastInspectionDate)
        pmiLastInspectionTooltip = `Last inspected ${daysSince} days ago on ${format(lastInspectionDate, "dd/MM/yyyy")} PKT`
      }
    }

    // Tooltip for PMI Next Inspection Status
    if (pmiData?.next_inspection_book_date) {
      const nextInspectionDate = parseFlexibleDate(pmiData.next_inspection_book_date)
      if (nextInspectionDate) {
        const daysDiff = differenceInDays(nextInspectionDate, today)
        pmiNextInspectionTooltip = daysDiff > 0
          ? `${daysDiff} days remaining until ${format(nextInspectionDate, "dd/MM/yyyy")} PKT`
          : `Overdue by ${Math.abs(daysDiff)} days since ${format(nextInspectionDate, "dd/MM/yyyy")} PKT`
      }
    }

    const isExpired = motData?.next_inspection_booked_before?.includes("Expired")
    const isBooked = motData?.next_inspection_booked_before === "Booked"

    switch (activeFilter) {
      case "All Data":
        return (
          <tr
            key={`${item.vehicle_reg}-${index}`}
            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <td className="p-3 font-medium text-gray-900 border-r border-gray-200 sticky left-0 z-10 bg-white">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isExpired ? "bg-red-500/30" : isBooked ? "bg-green-500/30" : "bg-orange-500/30"
                  }`}
                ></div>
                {item.vehicle_reg}
              </div>
            </td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200" title={motExpiryTooltip}>
              {formatDateDmy(motData?.mot_expiry)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(motData?.next_mot_booked_from)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(motData?.next_mot_booked_date)}</td>
            <td className="p-2 text-sm border-r border-gray-200">{getStatusBadge(motData?.time_mot_booked)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(motData?.last_inspection_date)}</td>
            <td className="p-2 text-sm border-r border-gray-200">{getStatusBadge(motData?.next_inspection_booked_before, motData?.mot_expiry)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200" title={pmiLastInspectionTooltip}>
              {formatDateDmy(pmiData?.last_inspection_date)}
            </td>
            <td className="p-2 text-sm border-r border-gray-200" title={pmiNextInspectionTooltip}>
              {getStatusBadge(pmiData?.next_inspection_status, pmiData?.next_inspection_book_date)}
            </td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(vehicleData?.tacho?.last_download)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(vehicleData?.tacho?.next_download)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(vehicleData?.tyre?.last_check)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(vehicleData?.tyre?.next_check)}</td>
            <td className="p-2 text-sm text-gray-900 border-r border-gray-200">{formatDateDmy(vehicleData?.insurance?.expiry)}</td>
            <td className="p-2 text-sm text-gray-900">{formatDateDmy(vehicleData?.calibrations?.expiry)}</td>
          </tr>
        )
      case "MOT":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-orange-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900" title={motExpiryTooltip}>{formatDateDmy(item.mot_expiry)}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.next_mot_booked_from)}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.next_mot_booked_date)}</td>
            <td className="p-3 text-sm">{getStatusBadge(item.time_mot_booked)}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.last_inspection_date)}</td>
            <td className="p-3 text-sm">{getStatusBadge(item.next_inspection_booked_before, item.mot_expiry)}</td>
          </tr>
        )
      case "PMI Inspection":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-pink-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900" title={pmiNextInspectionTooltip}>
              {formatDateDmy(item.next_inspection_book_date)}
            </td>
            <td className="p-3 text-sm text-gray-900" title={pmiLastInspectionTooltip}>
              {formatDateDmy(item.pmi_last_inspection_date)}
            </td>
            <td className="p-3 text-sm" title={pmiNextInspectionTooltip}>
              {getStatusBadge(item.pmi_next_inspection_status, item.next_inspection_book_date)}
            </td>
          </tr>
        )
      case "Vehicle Tacho Download":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-blue-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.last_download)}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.next_download)}</td>
          </tr>
        )
      case "Tyre Maintenance Check":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-purple-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.last_check)}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.next_check)}</td>
          </tr>
        )
      case "Insurance & Check":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-green-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.expiry)}</td>
          </tr>
        )
      case "Calibrations":
        return (
          <tr key={`${item.vehicle_reg}-${index}`} className="border-b border-gray-100 hover:bg-yellow-50">
            <td className="p-3 font-medium text-gray-900">{item.vehicle_reg}</td>
            <td className="p-3 text-sm text-gray-900">{formatDateDmy(item.expiry)}</td>
          </tr>
        )
      default:
        return null
    }
  }

  const handlePreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1)
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1)

  const getRowRange = () => {
    const start = (currentPage - 1) * perPage + 1
    const end = Math.min(currentPage * perPage, filteredData.length)
    return `${start}-${end}`
  }

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Maintenance & Compliance Overview</h1>
        <p className="text-gray-600">Monitor and manage vehicle compliance across all categories</p>
      </div>
 
      {/* Filters */}
      <div className="">
        <div className="flex flex-wrap gap-1">
          {filterOptions.map((filter) => {
            const Icon = filter.icon
            const isActive = activeFilter === filter.key
            return (
              <div className="flex items-center group" key={filter.key}>
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex items-center h-[30px] gap-2 px-4 py-2 text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-gray-600"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {filter.label}
              </button>
              <div
                className={`w-0 h-0 border-b-[30px] ${
                  isActive ? "border-b-orange-500" : "border-b-transparent"
                } border-r-[30px] border-r-transparent`}
              ></div>
            </div>
            )
          })}
        </div>
      </div>
      {/* Search and Vehicle Type Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 z-1 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search vehicles..."
            className="pl-9 w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white border-gray-300">
              {vehicleType} <Filter className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setVehicleType("All Vehicles")}>All Vehicles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVehicleType("16-Seater MK7")}>16-Seater MK7</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVehicleType("16-Seater MK8")}>16-Seater MK8</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
   
      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12 text-gray-500/30">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading vehicle data...
          </div>
        ) : error ? (
          <div className="text-red-500/30 text-center py-12">
            <div className="text-lg font-medium mb-2">Error Loading Data</div>
            <div className="text-sm">{error}</div>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>{renderTableHeaders()}</thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => renderTableRow(item, index))
                ) : (
                  <tr>
                    <td
                      colSpan={activeFilter === "All Data" ? 14 : activeFilter === "MOT" ? 7 : activeFilter === "PMI Inspection" ? 4 : 3}
                      className="text-center py-12 text-gray-500/30"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-lg font-medium">No vehicles found</div>
                        <div className="text-sm">
                          No vehicles match the current filter:{" "}
                          <span className="font-medium text-orange-600">{activeFilter}</span>
                        </div>
                        <Button
                          onClick={() => setActiveFilter("All Data")}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Show All Vehicles
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500/30">
            Showing {getRowRange()} of {filteredData.length} vehicles
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="bg-white border-gray-300"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
              if (page < 1 || page > totalPages) return null
              return (
                <Button
                  key={page}
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`${
                    currentPage === page
                      ? "bg-orange-500/30 text-white border-orange-500/30"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </Button>
              )
            }).filter(Boolean)}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="bg-white border-gray-300"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}