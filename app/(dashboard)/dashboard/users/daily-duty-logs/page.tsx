"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, X, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

/* ---------------------------------- Types --------------------------------- */

interface DriverLogStats {
  user_id: number
  full_name: string
  current_total: number
  current_complete: number
  current_incomplete: number
  awaiting_approval: number
  historical_incomplete: number
  historical_complete: number
}

/* ------------------------------ Pill Component ---------------------------- */

const CountPill = ({
  value,
  color = "orange",
  onClick,
  disabled = false,
}: {
  value: number
  color?: "orange" | "red" | "yellow" | "green" | "blue"
  onClick?: () => void
  disabled?: boolean
}) => {
  if (value === 0) return <span className="text-sm text-muted-foreground">0</span>

  const colors = {
    orange: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    red: "bg-red-100 text-red-800 hover:bg-red-200",
    yellow: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    green: "bg-green-100 text-green-800 hover:bg-green-200",
    blue: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  }

  return (
    <span
      className={`inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-colors ${colors[color]} ${disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      onClick={!disabled && onClick ? onClick : undefined}
    >
      {value}
    </span>
  )
}

/* -------------------------------- Filters Types --------------------------- */

type FilterStatus =
  | "all"
  | "has-incomplete-current"
  | "has-awaiting"
  | "has-incomplete-historical"
  | "good-compliance"

interface Filters {
  status: FilterStatus
  minIncompleteCurrent: number
  minAwaiting: number
  sortBy:
  | "name"
  | "current-incomplete"
  | "awaiting"
  | "historical-incomplete"
}

/* ------------------------------ Main Component ---------------------------- */

export default function DriverLogsOverview() {
  const router = useRouter()
  const token = useCookies().get("access_token")

  const [drivers, setDrivers] = useState<DriverLogStats[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<Filters>({
    status: "all",
    minIncompleteCurrent: 0,
    minAwaiting: 0,
    sortBy: "name",
  })

  // Reset page when filters or search change
  useEffect(() => {
    setPage(1)
  }, [search, filters])
  const fetchStats = async () => {
    if (!token) return
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/activity/duty-logs/dutylog-stats/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const json = await res.json()

      if (!json.success || !Array.isArray(json.data)) {
        setDrivers([])
        return
      }

      const mapped = json.data
        .filter((item: any) => item.user.role === "Driver")
        .map((item: any) => {
          const currentTotal = item.current?.total ?? 0
          const currentComplete = item.current?.complete ?? 0
          const currentIncompleteFromApi = item.current_incomplete ?? 0

          return {
            user_id: item.user.id,
            full_name: item.user.full_name,
            current_total: currentTotal,
            current_complete: currentComplete,
            current_incomplete:
              currentIncompleteFromApi > 0
                ? currentIncompleteFromApi
                : Math.max(0, currentTotal - currentComplete),
            awaiting_approval: item.historical_awaiting?.length ?? 0,
            historical_incomplete: item.historical_incomplete?.length ?? 0,
            historical_complete: item.historical_complete?.length ?? 0,
          }
        })

      setDrivers(mapped)
    } catch (err) {
      console.error("Failed to load logs stats:", err)
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {


    fetchStats()
  }, [token])

  const filteredAndSortedDrivers = useMemo(() => {
    let result = [...drivers]

    // Search
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((d) => d.full_name.toLowerCase().includes(term))
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((driver) => {
        switch (filters.status) {
          case "has-incomplete-current":
            return driver.current_incomplete > 0
          case "has-awaiting":
            return driver.awaiting_approval > 0
          case "has-incomplete-historical":
            return driver.historical_incomplete > 0
          case "good-compliance":
            return (
              driver.current_incomplete === 0 &&
              driver.awaiting_approval === 0 &&
              driver.historical_incomplete === 0
            )
          default:
            return true
        }
      })
    }

    // Minimum count filters
    if (filters.minIncompleteCurrent > 0) {
      result = result.filter(
        (d) => d.current_incomplete >= filters.minIncompleteCurrent
      )
    }
    if (filters.minAwaiting > 0) {
      result = result.filter(
        (d) => d.awaiting_approval >= filters.minAwaiting
      )
    }

    // Sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name)
        case "current-incomplete":
          return b.current_incomplete - a.current_incomplete
        case "awaiting":
          return b.awaiting_approval - a.awaiting_approval
        case "historical-incomplete":
          return b.historical_incomplete - a.historical_incomplete
        default:
          return 0
      }
    })

    return result
  }, [drivers, search, filters])

  const paginated = filteredAndSortedDrivers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )
  const totalPages = Math.ceil(filteredAndSortedDrivers.length / rowsPerPage)

  const navigateToDetail = (driverId: number, category: string, Name: string) => {
    router.push(`/dashboard/users/daily-duty-logs/${driverId}?tab=${category}&name=${Name}`)
  }

  const resetFilters = () => {
    setFilters({
      status: "all",
      minIncompleteCurrent: 0,
      minAwaiting: 0,
      sortBy: "name",
    })
    setSearch("")
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.minIncompleteCurrent > 0 ||
    filters.minAwaiting > 0 ||
    search.trim() !== ""

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading driver logs statistics...
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-6 bg-white">
      <div>
        <h1 className="text-2xl font-bold">Driver Logs Management</h1>
        <p className="text-muted-foreground mt-1">
          Track current week and historical duty log compliance
        </p>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 z-10 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search driver..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              onClick={fetchStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`w-4 h-4  ${loading ? "animate-spin" : ""
                  }`}
              />

            </Button>
            <Select
              value={filters.status}
              onValueChange={(v: FilterStatus) =>
                setFilters((prev) => ({ ...prev, status: v }))
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="has-incomplete-current">
                  Has Current Incomplete
                </SelectItem>
                <SelectItem value="has-awaiting">Awaiting Approval</SelectItem>
                <SelectItem value="has-incomplete-historical">
                  Historical Incomplete
                </SelectItem>
                <SelectItem value="good-compliance">Good Compliance ✓</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: v as Filters["sortBy"],
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="current-incomplete">
                  Most Incomplete (Current)
                </SelectItem>
                <SelectItem value="awaiting">Most Awaiting Approval</SelectItem>
                <SelectItem value="historical-incomplete">
                  Most Historical Incomplete
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>

          {/* Optional numeric filters */}
          {filters.status === "all" && (
            <div className="flex flex-wrap gap-6 text-sm items-center pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">
                  Min current incomplete:
                </span>
                <Select
                  value={String(filters.minIncompleteCurrent)}
                  onValueChange={(v) =>
                    setFilters((prev) => ({
                      ...prev,
                      minIncompleteCurrent: Number(v),
                    }))
                  }
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    {[1, 2, 3, 5, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">
                  Min awaiting approval:
                </span>
                <Select
                  value={String(filters.minAwaiting)}
                  onValueChange={(v) =>
                    setFilters((prev) => ({
                      ...prev,
                      minAwaiting: Number(v),
                    }))
                  }
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any</SelectItem>
                    {[1, 2, 3, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}+
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 text-center font-medium">#</TableHead>
              <TableHead className="font-medium min-w-[180px]">Driver Name</TableHead>

              <TableHead
                colSpan={3}
                className="text-center font-semibold bg-amber-50/60 border-b border-amber-200"
              >
                Current Week Logs
              </TableHead>

              <TableHead
                colSpan={3}
                className="text-center font-semibold bg-slate-50 border-b border-slate-200"
              >
                Historical Logs Data
              </TableHead>
            </TableRow>

            <TableRow className="bg-muted/30">
              <TableHead className="w-14"></TableHead>
              <TableHead></TableHead>
              <TableHead className="text-center text-xs font-medium">Total</TableHead>
              <TableHead className="text-center text-xs font-medium">Incomplete</TableHead>
              <TableHead className="text-center text-xs font-medium">Complete</TableHead>
              <TableHead className="text-center text-xs font-medium">Awaiting Approval</TableHead>
              <TableHead className="text-center text-xs font-medium">Incomplete</TableHead>
              <TableHead className="text-center text-xs font-medium">Complete</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.map((driver, idx) => (
              <TableRow key={driver.user_id} className="hover:bg-muted/50">
                <TableCell className="text-center text-muted-foreground">
                  {(page - 1) * rowsPerPage + idx + 1}
                </TableCell>
                <TableCell className="font-medium">{driver.full_name}</TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.current_total}
                    onClick={() => navigateToDetail(driver.user_id, "current", driver.full_name)}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.current_incomplete}
                    color="red"
                    onClick={() =>
                      driver.current_incomplete > 0 &&
                      navigateToDetail(driver.user_id, "current-incomplete", driver.full_name)
                    }
                    disabled={true}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.current_complete}
                    color="green"
                    onClick={() =>
                      driver.current_complete > 0 &&
                      navigateToDetail(driver.user_id, "current-complete", driver.full_name)
                    }
                    disabled={true}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.awaiting_approval}
                    color="yellow"
                    onClick={() =>
                      driver.awaiting_approval > 0 &&
                      navigateToDetail(driver.user_id, "awaiting-approval", driver.full_name)
                    }
                    disabled={driver.awaiting_approval === 0}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.historical_incomplete}
                    color="red"
                    onClick={() =>
                      driver.historical_incomplete > 0 &&
                      navigateToDetail(driver.user_id, "historical-incomplete", driver.full_name)
                    }
                    disabled={driver.historical_incomplete === 0}
                  />
                </TableCell>

                <TableCell className="text-center">
                  <CountPill
                    value={driver.historical_complete}
                    color="green"
                    onClick={() =>
                      driver.historical_complete > 0 &&
                      navigateToDetail(driver.user_id, "historical-complete", driver.full_name)
                    }
                    disabled={driver.historical_complete === 0}
                  />
                </TableCell>
              </TableRow>
            ))}

            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No drivers found {search ? `matching "${search}"` : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {filteredAndSortedDrivers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * rowsPerPage + 1} to{" "}
            {Math.min(page * rowsPerPage, filteredAndSortedDrivers.length)} of{" "}
            {filteredAndSortedDrivers.length} drivers
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground min-w-[90px] text-center">
              Page {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}