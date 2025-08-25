"use client"

import type React from "react"
import { useState } from "react"

import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"



// const pageConfig = {
//   "/": { title: "Dashboard", subtitle: "Welcome back! Here's your vehicle management overview." },
//   "/users": { title: "User Management", subtitle: "Manage your team members and their permissions", showActions: true },
//   "/vehicles": { title: "Vehicles", subtitle: "Manage your fleet and vehicle information" },
//   "/staff": { title: "Staff", subtitle: "Manage staff schedules and information" },
//   "/notifications": { title: "Notifications", subtitle: "Manage your notifications" },
// }

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  // const pathname = usePathname()
  // const config = pageConfig[pathname as keyof typeof pageConfig] || { title: "Dashboard", subtitle: "" }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header  />
        <main className="flex-1 overflow-y-auto">
          
          {children}</main>
      </div>
    </div>
  )
}