"use client"

import { ProfileTabs } from "@/components/profile/profile-tabs"
import { TabContent } from "@/components/profile/tab-content"
import { useState } from "react"


export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("CRB Profile")
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "04/21/2020",
    phoneNumber: "+923457898",
    address: "New york city street # 02",
    postCode: "44444",
    phoneNumber2: "+923457898",
    address2: "New york city street # 02",
    postCode2: "44444",
    roleOrCRB: "Dummy text",
    emailAddress: "New york city street # 02",
    phSignupManager: "",
    notes:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900 mb-1">Profile Setting</h1>
          <p className="text-sm text-gray-500">Welcome to profile settings below</p>
        </div>

        <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <TabContent activeTab={activeTab} formData={formData} onInputChange={handleInputChange} />
      </div>
    </div>
  )
}
