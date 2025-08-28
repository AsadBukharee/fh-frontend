"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export function IdDocuments() {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-4">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">ID Documents</h2>
            <p className="text-sm text-gray-500">Employee ID Documents</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Passport Document</label>
            <div className="text-center">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 text-sm">Choose File</Button>
              <p className="text-xs text-gray-500 mt-2">PDF, PNG</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Proof of Address</label>
            <div className="text-center">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 text-sm">Choose File</Button>
              <p className="text-xs text-gray-500 mt-2">PDF, PNG</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
