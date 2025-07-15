"use client"

import { useState, useEffect, useRef } from "react"
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
  ClipboardCheck,
  Stethoscope,
  LifeBuoy,
  File,
  Fuel,
  User,
  UserPlus,
  Building2,
  BookUser,
  CalendarCheck,
  RefreshCw,
  LogIn,
  Activity,
  UserCheck,
  Book,
  Wrench,
  Database,
  Route,
  CalendarX,
  MoreHorizontal,
  SquareCheckBig,
  CalendarClock,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Dashboard_Loading } from "./Dashboard_Loading"

// Map API icon strings to Lucide icon components
const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Truck,
  ClipboardCheck,
  Fuel,
  LifeBuoy,
  Stethoscope,
  ShieldCheck,
  Car,
  BarChart3,
  Users,
  FileText,
  File,
  ClipboardList,
  CheckSquare,
  Clock,
  Settings,
  BookOpen,
  Bell,
  User,
  UserPlus,
  Building2,
  BookUser,
  CalendarCheck,
  RefreshCw,
  LogIn,
  Activity,
  UserCheck,
  Book,
  Wrench,
  Database,
  Route,
  CalendarX,
  MoreHorizontal,
  SquareCheckBig,
  CalendarClock,
}

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active: boolean
  children?: Omit<MenuItem, "icon" | "active">[]
}

interface ApiMenuItem {
  nav: string
  icon: string
  name: string
  tooltip: string
  children: ApiMenuItem[] | null | undefined // Allow undefined for robustness
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

function mapApiMenuToMenuItem(apiMenu: ApiMenuItem): MenuItem {
  return {
    icon: iconMap[apiMenu.icon] || undefined,
    label: apiMenu.name,
    href: apiMenu.nav,
    active: false,
    children: Array.isArray(apiMenu.children)
      ? apiMenu.children.map((child) => ({
          label: child.name,
          href: child.nav,
          icon: iconMap[child.icon] || undefined,
          children: Array.isArray(child.children)
            ? child.children.map((grandchild) => ({
                label: grandchild.name,
                href: grandchild.nav,
                icon: iconMap[grandchild.icon] || undefined,
                children: Array.isArray(grandchild.children)
                  ? grandchild.children.map((greatGrandchild) => ({
                      label: greatGrandchild.name,
                      href: greatGrandchild.nav,
                      icon: iconMap[greatGrandchild.icon] || undefined,
                    }))
                  : undefined,
              }))
            : undefined,
        }))
      : undefined,
  }
}

function MenuItem({ item, level, isCollapsed, pathname }: { item: MenuItem; level: number; isCollapsed: boolean; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === `/dashboard${item.href}`
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
      <Link href={`/dashboard${item.href}`}>
        <div
          ref={buttonRef}
          onMouseMove={handleMouseMove}
          className={`flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-300 ripple cursor-glow ${
            isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
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
                {item.icon && <item.icon className="w-5 h-5" />}
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
        <Link href={`/dashboard${item.href}`}>
          <div
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-300 ripple cursor-glow ${
              isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {item.icon && <item.icon className="w-5 h-5 relative z-10" />}
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()
  const role = cookies.get("role")

  // Fetch menu data from API
  useEffect(() => {
    async function fetchMenu() {
      try {
        setIsLoading(true)
        setError(null)
        if (!role) {
          throw new Error("No role found in cookies")
        }
        const response = await fetch(`${API_URL}/access/roles/get-menu?role=${role}`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        
        if (!data.menu?.items || !Array.isArray(data.menu.items)) {
          throw new Error("Invalid menu items in response")
        }
        const mappedMenus = data.menu.items.map(mapApiMenuToMenuItem)
       
        setMenuItems(mappedMenus)
      } catch (error) {
        console.error("Error fetching menu:", error)
        setError("Failed to load menu. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchMenu()
  }, [role])


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
            <img src="/logos/logo.png" alt="Foster Hartley Logo" className="w-8 h-8 object-contain" />
          </div>
        )}
        {isCollapsed && (
          <div className="flex items-center justify-center w-full">
            <img src="/logos/logo.png" alt="Foster Hartley Logo" className="w-8 h-8 object-contain" />
          </div>
        )}
        <Button
          ref={toggleRef}
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="ripple cursor-glow relative rounded-full h-8 w-8 left-8 bg-orange hover:bg-magenta"
          onMouseMove={handleToggleMouseMove}
        >
          <ChevronRight
            className={`w-6 h-6 transition-transform text-white duration-300 relative z-10 ${isCollapsed ? "" : "rotate-180"}`}
          />
        </Button>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isLoading && <Dashboard_Loading />}
        {error && <div className="text-red-600">{error}</div>}
        {!isLoading && !error && menuItems.length === 0 && <div>No menu items available.</div>}
        {menuItems.map((item, index) => (
          <MenuItem key={index} item={item} level={0} isCollapsed={isCollapsed} pathname={pathname} />
        ))}
      </nav>
    </div>
  )
}