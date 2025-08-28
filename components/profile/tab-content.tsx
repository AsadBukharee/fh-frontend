"use client"

import { PersonalInformation } from "./personal-information"
import { IdDocuments } from "./id-documents"

interface TabContentProps {
  activeTab: string
  formData: any
  onInputChange: (field: string, value: string) => void
}

export function TabContent({ activeTab, formData, onInputChange }: TabContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "CRB Profile":
        return (
          <>
            <PersonalInformation formData={formData} onInputChange={onInputChange} />
            <IdDocuments />
          </>
        )
      case "DyCA Profile":
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">DyCA Profile</h3>
            <p className="text-gray-500">DyCA profile content will be displayed here.</p>
          </div>
        )
      case "Accountant Profile":
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accountant Profile</h3>
            <p className="text-gray-500">Accountant profile content will be displayed here.</p>
          </div>
        )
      case "Home Office Profile":
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Home Office Profile</h3>
            <p className="text-gray-500">Home office profile content will be displayed here.</p>
          </div>
        )
      default:
        return null
    }
  }

  return <div>{renderContent()}</div>
}
