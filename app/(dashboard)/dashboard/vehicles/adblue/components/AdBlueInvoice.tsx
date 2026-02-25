"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Hash, Boxes, Truck, Layers, DollarSign, Upload, Plus } from "lucide-react"

export default function Page() {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-[#f4f6f8] p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            AdBlue Tracker
          </h1>
          <p className="text-sm text-gray-500">
            Fleet AdBlue Management System
          </p>
        </div>

        {/* Trigger Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#f15a29] hover:bg-[#d94d20] text-white gap-2 rounded-lg px-5">
              <Plus className="w-4 h-4" />
              Create New Batch/Invoice
            </Button>
          </DialogTrigger>

          {/* Modal */}
          <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
            <div className="p-6 space-y-5 bg-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Create New Batch/Invoice
                </DialogTitle>
              </DialogHeader>

              {/* Date */}
              <FormField
                label="Date Purchased *"
                icon={<Calendar className="w-4 h-4" />}
                type="date"
                defaultValue="2025-10-02"
              />

              {/* Batch No */}
              <FormField
                label="Batch Invoice Number *"
                icon={<Hash className="w-4 h-4" />}
                placeholder="e.g 745 KMS"
              />

              {/* Quantity */}
              <FormField
                label="Quantity Added Ltrs *"
                icon={<Boxes className="w-4 h-4" />}
                placeholder="Enter quantity"
              />

              {/* Purchase From */}
              <SelectField
                label="Purchase From"
                icon={<Truck className="w-4 h-4" />}
                placeholder="Select vehicle"
              />

              {/* Purchase No */}
              <SelectField
                label="Purchase No"
                icon={<Layers className="w-4 h-4" />}
                placeholder="Select Batch"
              />

              {/* Cost */}
              <SelectField
                label="Cost *"
                icon={<DollarSign className="w-4 h-4" />}
                placeholder="Select Refillers"
              />

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Notes</label>
                <Textarea
                  placeholder="Optional Notes"
                  className="resize-none h-20"
                />
              </div>

              {/* Upload */}
              <div className="space-y-2">
                <label className="text-sm text-gray-600">Add Invoice</label>
                <div className="border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-[#f15a29]" />
                  </div>
                  <span className="text-sm">Upload Image</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <Button className="w-full bg-[#f6cfc1] hover:bg-[#f3bba8] text-[#f15a29] gap-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                  Add TopUp Record
                </Button>

                <Button
                  variant="secondary"
                  className="w-full rounded-lg"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/* ---------- Reusable Fields ---------- */

function FormField({
  label,
  icon,
  type = "text",
  placeholder,
  defaultValue,
}: {
  label: string
  icon: React.ReactNode
  type?: string
  placeholder?: string
  defaultValue?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <Input
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="pl-9 h-10"
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  icon,
  placeholder,
}: {
  label: string
  icon: React.ReactNode
  placeholder: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
        <Input
          placeholder={placeholder}
          className="pl-9 h-10 cursor-pointer"
          readOnly
        />
      </div>
    </div>
  )
}