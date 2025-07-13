"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  BarChart3,
  Users,
  Car,
  FileText,
  Truck,
  ClipboardList,
  CheckSquare,
  Clock,
  ChevronRight,
  Settings,
  BookOpen,
  Bell,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: BarChart3, label: "Dashboard", href: "/dashboard", active: false },
  { icon: Users, label: "User Management", href: "/dashboard/users", active: false },
  {
    icon: Car,
    label: "Vehicles",
    href: "/dashboard/vehicles",
    active: false,
    children: [
      {
        label: "Walkaround Checks",
        href: "/dashboard/vehicles/walkaround",
        children: [
          {
            label: "Gate Keeper Checks",
            href: "/dashboard/vehicles/walkaround/gatekeeper",
            children: [
              { label: "Walkaround 2 (Supervisor checks Driver)", href: "/dashboard/vehicles/walkaround/gatekeeper/supervisor" },
              { label: "Walkaround 3 (Manager checks Supervisor)", href: "/dashboard/vehicles/walkaround/gatekeeper/manager" },
            ],
          },
        ],
      },
      { label: "Fuel Checks", href: "/dashboard/vehicles/fuel" },
      { label: "Tyre Checks", href: "/dashboard/vehicles/tyres" },
      { label: "Equipment Checks", href: "/dashboard/vehicles/equipment" },
      {
        label: "Valet Checks",
        href: "/dashboard/vehicles/valet",
        children: [
          {
            label: "Gate Keeper Checks",
            href: "/dashboard/vehicles/valet/gatekeeper",
            children: [
              { label: "Valet Check 2 (Supervisor checks Driver)", href: "/dashboard/vehicles/valet/gatekeeper/supervisor" },
              { label: "Valet Check 3 (Manager checks Supervisor)", href: "/dashboard/vehicles/valet/gatekeeper/manager" },
            ],
          },
        ],
      },
    ],
  },
  {
    icon: Users,
    label: "Staff",
    href: "/dashboard/staff",
    active: false,
    children: [
      { label: "Daily Duty Logs", href: "/dashboard/staff/duty-logs" },
      { label: "WTD Logs", href: "/dashboard/staff/wtd-logs" },
      { label: "Clocking In/Out Logs", href: "/dashboard/staff/clocking" },
      { label: "Rotas", href: "/dashboard/staff/rotas" },
      { label: "Contracts", href: "/dashboard/staff/contracts" },
    ],
  },
  {
    icon: CheckSquare,
    label: "MOTs & Inspections",
    href: "/dashboard/mots",
    active: false,
    children: [
      { label: "Maintenance PMI Analysis", href: "/dashboard/mots/maintenance-pmi" },
      { label: "Driver PMI Analysis", href: "/dashboard/mots/driver-pmi" },
      { label: "Service History", href: "/dashboard/mots/service-history" },
    ],
  },
  { icon: Settings, label: "Mechanic Jobs", href: "/dashboard/mechanic-jobs", active: false },
  {
    icon: Truck,
    label: "SU Transport Data",
    href: "/dashboard/su-transport",
    active: false,
    children: [{ label: "SU Numbers Screen", href: "/dashboard/su-transport/numbers" }],
  },
  {
    icon: Clock,
    label: "Audit Expiry Dates",
    href: "/dashboard/audit-expiry",
    active: false,
    children: [
      { label: "Vehicles", href: "/dashboard/audit-expiry/vehicles" },
      { label: "Drivers", href: "/dashboard/audit-expiry/drivers" },
      { label: "Others", href: "/dashboard/audit-expiry/others" },
    ],
  },
  { icon: BookOpen, label: "Knowledge Library", href: "/dashboard/knowledge-library", active: false },
  { icon: FileText, label: "Document List", href: "/dashboard/documents", active: false },
  { icon: ClipboardList, label: "Outstanding Tasks", href: "/dashboard/tasks", active: false },
  { icon: Bell, label: "Reminders", href: "/dashboard/reminders", active: false },
  { icon: ShieldCheck, label: "RBAC", href: "/dashboard/rbac", active: false },
]

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active: boolean
  children?: Omit<MenuItem, 'icon' | 'active'>[]
}

interface MenuItemProps {
  item: MenuItem
  level: number
  isCollapsed: boolean
  pathname: string
}

function MenuItem({ item, level, isCollapsed, pathname }: MenuItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href
  const buttonRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      buttonRef.current.style.setProperty("--mouse-x", `${x}%`)
      buttonRef.current.style.setProperty("--mouse-y", `${y}%`)
    }
  }

  if (isCollapsed && level === 0) {
    return (
      <Link href={item.href}>
        <div
          ref={buttonRef}
          onMouseMove={handleMouseMove}
          className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ripple cursor-glow ${
            isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {/* Increase icon size in collapsed state */}
          {item.icon && <item.icon className="w-5 h-5 relative z-10" />}
        </div>
      </Link>
    )
  }

  return (
    <div>
      {hasChildren ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div
              ref={buttonRef}
              onMouseMove={handleMouseMove}
              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ripple cursor-glow ${
                isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <div className="flex items-center space-x-3 relative z-10">
                {level === 0 && item.icon && <item.icon className="w-5 h-5" />}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-300 relative z-10 ${isOpen ? "rotate-90" : ""}`}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              {item.children?.map((child, index: number) => (
                <MenuItem key={index} item={child as MenuItem} level={level + 1} isCollapsed={isCollapsed} pathname={pathname} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <Link href={item.href}>
          <div
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ripple cursor-glow ${
              isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {level === 0 && item.icon && <item.icon className="w-5 h-5 relative z-10" />}
            <span className="text-sm font-medium relative z-10">{item.label}</span>
          </div>
        </Link>
      )}
    </div>
  )
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const toggleRef = useRef<HTMLButtonElement>(null)

  const handleToggleMouseMove = (e: React.MouseEvent) => {
    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      toggleRef.current.style.setProperty("--mouse-x", `${x}%`)
      toggleRef.current.style.setProperty("--mouse-y", `${y}%`)
    }
  }

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? "w-24" : "w-64"}`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <img 
              src="/logos/logo.png" 
              alt="Foster Hartley Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <img 
              src="/logos/logo.png" 
              alt="Foster Hartley Logo" 
              className="w-8 h-8 object-contain"
            />
          </div>
        )}
        <Button
          ref={toggleRef}
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="ripple cursor-glow relative bg-gray-100 hover:bg-gray-200"
          onMouseMove={handleToggleMouseMove}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-300 relative z-10 ${isCollapsed ? "" : "rotate-180"}`}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} level={0} isCollapsed={isCollapsed} pathname={pathname} />
        ))}
      </nav>
    </div>
  )
}
