"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"

interface PersonalInformationProps {
  formData: any
  onInputChange: (field: string, value: string) => void
}

export function PersonalInformation({ formData, onInputChange }: PersonalInformationProps) {
  return (
    <Card className="mb-6 border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-4">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-medium text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-500">Employee Personal Information</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <Input
              value={formData.firstName}
              onChange={(e) => onInputChange("firstName", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <Input
              value={formData.lastName}
              onChange={(e) => onInputChange("lastName", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <Input
              value={formData.dateOfBirth}
              onChange={(e) => onInputChange("dateOfBirth", e.target.value)}
              className="w-full h-10 border-gray-300"
              placeholder="MM/DD/YYYY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) => onInputChange("phoneNumber", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Code</label>
            <Input
              value={formData.postCode}
              onChange={(e) => onInputChange("postCode", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <Input
              value={formData.phoneNumber2}
              onChange={(e) => onInputChange("phoneNumber2", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <Input
              value={formData.address2}
              onChange={(e) => onInputChange("address2", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Code</label>
            <Input
              value={formData.postCode2}
              onChange={(e) => onInputChange("postCode2", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role or CRB</label>
            <Input
              value={formData.roleOrCRB}
              onChange={(e) => onInputChange("roleOrCRB", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <Input
              value={formData.emailAddress}
              onChange={(e) => onInputChange("emailAddress", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PH Signup Manager</label>
            <Input
              value={formData.phSignupManager}
              onChange={(e) => onInputChange("phSignupManager", e.target.value)}
              className="w-full h-10 border-gray-300"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => onInputChange("notes", e.target.value)}
            className="w-full h-20 resize-none border-gray-300"
          />
        </div>
      </CardContent>
    </Card>
  )
}
