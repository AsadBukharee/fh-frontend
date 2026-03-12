"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Calendar, Plus, Search, ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function AdBlueInvoice() {
  const [open, setOpen] = React.useState(false)

  // Mock data for the table
  const data = Array(10).fill({
    date: "19/02/2026",
    batch: "7874 MPH",
    quantity: "15 L",
    purchaseFrom: "Honda",
    purchaseBy: "John Smith",
    cost: "£254.33",
    invoice: "ford invoice.pdf",
    notes: "100Ls of Ad Blue bulk Purchase fro",
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AdBlue Tracker</h1>
            <p className="text-sm text-gray-400 font-medium">Fleet AdBlue Management System</p>
          </div>



          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#f15a29] hover:bg-[#d94d20] text-white gap-2 rounded-lg px-6 h-11">
                <Plus className="w-5 h-5" />
                Create New Batch/Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-0">
              <div className="p-6 space-y-5 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold border-b pb-4">
                    Create New Batch/Invoice
                  </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Date Purchased *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input type="date" className="pl-10 h-10 rounded-md border-gray-200" defaultValue="2025-10-02" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Batch Invoice Number *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">#</span>
                      <Input placeholder="e.g 745 KMS" className="pl-10 h-10 rounded-md border-gray-200" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Quantity Added Ltrs *</label>
                    <Input placeholder="Enter quantity" className="h-10 rounded-md border-gray-200" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Purchase From</label>
                    <Select>
                      <SelectTrigger className="h-10 rounded-md border-gray-200">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="honda">Honda</SelectItem>
                        <SelectItem value="toyota">Toyota</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Notes</label>
                    <Textarea placeholder="Optional Notes" className="resize-none h-24 rounded-md border-gray-200" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Add Invoice</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-2">
                        <Upload className="w-6 h-6 text-[#f15a29]" />
                      </div>
                      <span className="text-sm font-medium">Upload Image</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button className="w-full bg-[#f6cfc1] translate-y-0.5 active:translate-y-0 hover:bg-[#f3bba8] text-[#f15a29] font-semibold h-11 rounded-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add TopUp Record
                  </Button>
                  <Button variant="outline" className="w-full h-11 rounded-lg border-gray-200" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-6 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Date From</label>
            <div className="relative group">
              <Input type="date" defaultValue="11/01/23" className="h-11 rounded-lg border-gray-200 pr-10 hover:border-orange-200 transition-colors" />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Date To</label>
            <div className="relative group">
              <Input type="date" defaultValue="11/01/23" className="h-11 rounded-lg border-gray-200 pr-10 hover:border-orange-200 transition-colors" />
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Purchase From</label>
            <div className="relative">
              <Input placeholder="Search..." className="h-11 rounded-lg border-gray-200" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Purchase By</label>
            <div className="relative">
              <Input placeholder="Search..." className="h-11 rounded-lg border-gray-200" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Batch/Invoice No</label>
            <div className="relative">
              <Input placeholder="Search..." className="h-11 rounded-lg border-gray-200" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Cost</label>
            <div className="relative">
              <Input placeholder="Search..." className="h-11 rounded-lg border-gray-200" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          <Table className="border-none">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-b border-gray-100">
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none text-left pl-6">Purchase Date</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none">Batch/Invoice#</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none">Quantity</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none text-left">Purchase From</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none text-left">Purchase by</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none">Cost</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none text-left">Invoice</TableHead>
                <TableHead className="text-gray-700 font-semibold h-14 bg-transparent border-none text-left">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 h-16">
                  <TableCell className="text-left pl-6 font-medium text-gray-600 bg-white border-none">{row.date}</TableCell>
                  <TableCell className="bg-white border-none">
                    <Badge variant="outline" className="bg-[#FFF1EB] text-[#F15A29] border-none rounded-md px-3 py-1 font-semibold whitespace-nowrap">
                      {row.batch}
                    </Badge>
                  </TableCell>
                  <TableCell className="bg-white border-none">
                    <Badge variant="outline" className="bg-[#EBFFF5] text-[#2ECC71] border-none rounded-md px-3 py-1 font-semibold whitespace-nowrap">
                      {row.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left text-gray-600 bg-white border-none">{row.purchaseFrom}</TableCell>
                  <TableCell className="text-left text-gray-600 bg-white border-none">{row.purchaseBy}</TableCell>
                  <TableCell className="bg-white border-none">
                    <Badge variant="outline" className="bg-[#EBFFF5] text-[#2ECC71] border-none rounded-md px-3 py-1 font-semibold">
                      {row.cost}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left bg-white border-none">
                    <a href="#" className="text-[#FF5252] hover:underline underline-offset-4 font-medium decoration-1">
                      {row.invoice}
                    </a>
                  </TableCell>
                  <TableCell className="text-left text-gray-400 text-sm max-w-[200px] truncate bg-white border-none">
                    {row.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center py-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">Row Page</span>
            <div className="relative group">
              <Input defaultValue="01" readOnly className="w-14 h-10 rounded-lg text-center font-semibold bg-white border-gray-200 pr-5" />
              <ChevronRight className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" className="gap-2 text-gray-500 hover:bg-transparent">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex gap-1 mx-2">
              <Button className="w-9 h-9 bg-[#F15A29] hover:bg-[#F15A29] text-white rounded-md font-bold">1</Button>
              <Button variant="ghost" className="w-9 h-9 text-gray-500 font-semibold">2</Button>
              <Button variant="ghost" className="w-9 h-9 text-gray-500 font-semibold">3</Button>
              <span className="px-1 text-gray-400">...</span>
              <Button variant="ghost" className="w-9 h-9 text-gray-500 font-semibold">67</Button>
              <Button variant="ghost" className="w-9 h-9 text-gray-500 font-semibold">68</Button>
            </div>
            <Button variant="ghost" className="gap-2 text-gray-500 hover:bg-transparent">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
