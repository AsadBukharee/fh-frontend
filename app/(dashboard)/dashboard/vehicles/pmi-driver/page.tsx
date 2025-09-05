"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle, Clock, Search, Filter, Plus, Eye, Edit, Trash, MoreHorizontal } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import BadgeList from "@/components/BadgeList"
import DefectsInput from "@/components/ui/DefectsInput"

interface PMIRecord {
  id: number
  pmi: number
  notes: string
  status: string
  vehicle: number
  created_at: string
  updated_at: string
  created_by: number
  action_taken: string
  identified_by_driver: boolean
  defect_previously_noted: boolean
  pmi_expiry: string
  vehicle_reg: string
  defects: string
  pmi_report_date: string
}

export default function PMIDashboard() {
  const [pmiData, setPmiData] = useState<PMIRecord[]>([])
  const [filteredData, setFilteredData] = useState<PMIRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewRecord, setViewRecord] = useState<PMIRecord | null>(null)
  const [editRecord, setEditRecord] = useState<PMIRecord | null>(null)
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null)

  // Mock data based on the API response structure
  useEffect(() => {
    const mockData: PMIRecord[] = [
      {
        id: 1,
        pmi: 1,
        notes: "No defects found",
        status: "completed",
        vehicle: 4,
        created_at: "2025-01-28T15:40:43.715997Z",
        updated_at: "2025-01-28T15:40:43.715997Z",
        created_by: 5,
        action_taken:
          "Training for driver (once done pls add details in driver conduct file and remove colour from this row).",
        identified_by_driver: true,
        defect_previously_noted: true,
        pmi_expiry: "2025-10-15",
        vehicle_reg: "YGZ 2055",
        defects: "No defects reported, Tyre dates checked internally and indate",
        pmi_report_date: "2025-01-28",
      },
      {
        id: 2,
        pmi: 2,
        notes: "Minor wear detected",
        status: "pending",
        vehicle: 5,
        created_at: "2025-08-14T15:40:43.715997Z",
        updated_at: "2025-08-14T15:40:43.715997Z",
        created_by: 5,
        action_taken:
          "All drivers sent a whatsapp message on the 05.02.24 at 17.07pm on the drivers group - message saved for any future audits.",
        identified_by_driver: false,
        defect_previously_noted: false,
        pmi_expiry: "2025-10-15",
        vehicle_reg: "FH789",
        defects: "Front left tire showing signs of wear",
        pmi_report_date: "2024-03-20",
      },
    ]

    setTimeout(() => {
      setPmiData(mockData)
      setFilteredData(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  // Filter and search functionality
  useEffect(() => {
    let filtered = pmiData

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.vehicle_reg.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.defects.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.notes.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    setFilteredData(filtered)
  }, [searchTerm, statusFilter, pmiData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "created":
        return (
          <Badge variant="outline">
            <Plus className="w-3 h-3 mr-1" />
            Created
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDefectSeverity = (defects: string) => {
    if (defects.toLowerCase().includes("no defects")) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          No Issues
        </Badge>
      )
    }
    if (defects.toLowerCase().includes("wear") || defects.toLowerCase().includes("minor")) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Minor
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Attention Required
      </Badge>
    )
  }

  const handleEdit = (record: PMIRecord) => {
    setEditRecord({ ...record })
  }

  const handleEditSubmit = () => {
    if (editRecord) {
      setPmiData(pmiData.map((item) => (item.id === editRecord.id ? editRecord : item)))
      setEditRecord(null)
    }
  }

  const handleDelete = (id: number) => {
    setPmiData(pmiData.filter((item) => item.id !== id))
    setDeleteRecordId(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading PMI data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto bg-white p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PMI Driver Dashboard</h1>
          <p className="text-muted-foreground">Preventive Maintenance Inspection Reports</p>
        </div>
      </div>

   
      <Card>
        <CardHeader>
          <CardTitle>PMI Reports</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {pmiData.length} reports
          </CardDescription>
           <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative w-[300px]">
                <Search className="absolute left-3 top-3 z-4 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle reg, defects, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New PMI Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Vehicle Reg</TableHead>
                  <TableHead>Defects</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Driver ID</TableHead>
                  <TableHead>Previously Noted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action Required</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.pmi_report_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="shrink-0">{record.vehicle_reg}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={record.defects}>
                        <BadgeList value={record.defects} />
                      </div>
                    </TableCell>
                    <TableCell>{getDefectSeverity(record.defects)}</TableCell>
                    <TableCell>
                      <Badge variant={record.identified_by_driver ? "default" : "secondary"}>
                        {record.identified_by_driver ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.defect_previously_noted ? "destructive" : "default"}>
                        {record.defect_previously_noted ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={record.action_taken}>
                        {record.action_taken}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setViewRecord(record)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {viewRecord && (
                              <DialogContent className=" h-[500px] overflow-y-auto ">
                                <DialogHeader>
                                  <DialogTitle>PMI Report Details</DialogTitle>
                                  <DialogDescription>Record ID: {viewRecord.id}</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div>
                                    <Label>Vehicle Registration</Label>
                                    <p>{viewRecord.vehicle_reg}</p>
                                  </div>
                                  <div>
                                    <Label>Defects</Label>
                                    <p><BadgeList value={viewRecord.defects} /></p>
                                  </div>
                                  <div>
                                    <Label>Notes</Label>
                                    <p>{viewRecord.notes}</p>
                                  </div>
                                  <div>
                                    <Label>Action Taken</Label>
                                    <p>{viewRecord.action_taken}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p>{viewRecord.status}</p>
                                  </div>
                                  <div>
                                    <Label>PMI Expiry</Label>
                                    <p>{viewRecord.pmi_expiry}</p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => setViewRecord(null)}>Close</Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  handleEdit(record)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </DialogTrigger>

{editRecord && (
  <DialogContent className="h-[500px] overflow-y-auto rounded-2xl shadow-lg">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">
        Edit PMI Report
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Editing record <span className="font-medium">#{editRecord.id}</span>
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-4">
      {/* Vehicle Reg */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="vehicle_reg">Vehicle Reg</Label>
        <Input
          id="vehicle_reg"
          value={editRecord.vehicle_reg}
          onChange={(e) =>
            setEditRecord({ ...editRecord, vehicle_reg: e.target.value })
          }
          placeholder="Enter vehicle registration"
          className="w-full"
        />
      </div>

      {/* Defects */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="defects">Defects</Label>
        <DefectsInput
          value={editRecord.defects}
          onChange={(newValue) =>
            setEditRecord({ ...editRecord, defects: newValue })
          }
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={editRecord.notes}
          onChange={(e) =>
            setEditRecord({ ...editRecord, notes: e.target.value })
          }
          placeholder="Additional notes"
          className="min-h-[80px]"
        />
      </div>

      {/* Action Taken */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="action_taken">Action Taken</Label>
        <Textarea
          id="action_taken"
          value={editRecord.action_taken}
          onChange={(e) =>
            setEditRecord({ ...editRecord, action_taken: e.target.value })
          }
          placeholder="Document actions taken"
          className="min-h-[80px]"
        />
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={editRecord.status}
          onValueChange={(value) => setEditRecord({ ...editRecord, status: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">✅ Completed</SelectItem>
            <SelectItem value="pending">⏳ Pending</SelectItem>
            <SelectItem value="created">📝 Created</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <DialogFooter className="flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setEditRecord(null)}
        className="rounded-xl"
      >
        Cancel
      </Button>
      <Button onClick={handleEditSubmit} className="rounded-xl">
        Save
      </Button>
    </DialogFooter>
  </DialogContent>
)}


                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setDeleteRecordId(record.id)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DialogTrigger>
                            {deleteRecordId === record.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm Deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this PMI report? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteRecordId(null)}>
                                    Cancel
                                  </Button>
                                  <Button variant="destructive" onClick={() => handleDelete(record.id)}>
                                    Delete
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No PMI reports found matching your search criteria.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
