"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  BarChart3,
  Headset,
  Users,
  Car,
  FileText,
  Truck,
  ClipboardList,
  CheckSquare,
  Joystick,
  TowerControl,
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
  MapPin,
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
  Map,
  ListChecks,
  List,
  Waypoints,
  TypeOutline,
  RefreshCcw
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { Dashboard_Loading } from "./Dashboard_Loading"

// Move iconMap outside component to prevent recreation on every render
const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Truck,
  ClipboardCheck,
  Fuel,
  RefreshCcw,
  LifeBuoy,
  Stethoscope,
  ShieldCheck,
  Car,
  BarChart3,
  Users,
  Joystick,
  FileText,
  TowerControl,
  File,
  ClipboardList,
  Waypoints,
  CheckSquare,
  Clock,
  Settings,
  TypeOutline,
  BookOpen,
  Bell,
  User,
  UserPlus,
  Building2,
  BookUser,
  CalendarCheck,
  Headset,
  RefreshCw,
  Map,
  MapPin,
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
  List, // Fallback for ListNumbers
  ListChecks,
  ListNumbers: List, // Fallback for ListNumbers
}

interface MenuItem {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active: boolean
  tooltip?: string
  children?: Omit<MenuItem, "active">[]
}

interface ApiMenuItem {
  nav: string
  icon: string
  name: string
  tooltip: string
  children: ApiMenuItem[] | null | undefined
  isSelected?: boolean
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

// Normalize href to avoid duplicate /dashboard
const normalizeHref = (href: string) => {
  return href.startsWith("/dashboard") ? href : `/dashboard${href}`
}

// Recursive function to map API menu to MenuItem
const mapApiMenuToMenuItem = (apiMenu: ApiMenuItem): MenuItem => ({
  icon: ICON_MAP[apiMenu.icon] || File, // Fallback to File icon
  label: apiMenu.name,
  href: apiMenu.nav,
  active: apiMenu.isSelected || false,
  tooltip: apiMenu.tooltip,
  children: Array.isArray(apiMenu.children)
    ? apiMenu.children.map(mapApiMenuToMenuItem)
    : undefined,
})

// Memoized MenuItem component to prevent unnecessary re-renders
const MenuItem = memo(
  ({
    item,
    level,
    isCollapsed,
    pathname,
  }: {
    item: MenuItem
    level: number
    isCollapsed: boolean
    pathname: string
  }) => {
    const isActive = pathname === normalizeHref(item.href)
    const hasChildren = item.children && item.children.length > 0
    // Open collapsible if any child matches the current pathname
    const isOpenInitially = hasChildren && item.children?.some((child) => pathname.includes(child.href));
    const [isOpen, setIsOpen] = useState(isOpenInitially)

    const buttonStyles = useMemo(
      () => ({
        paddingLeft: `${12 + level * 16}px`,
      }),
      [level],
    )

    const baseClasses = useMemo(
      () =>
        `flex items-center rounded-lg cursor-pointer transition-colors duration-200 ${isActive ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-100"
        }`,
      [isActive],
    )

    // Hide sub-items in collapsed mode
    if (isCollapsed && level > 0) {
      return null
    }

    if (isCollapsed && level === 0) {
      return (
        <Link href={normalizeHref(item.href)} className="block">
          <div className={`${baseClasses} justify-center p-3`} title={item.tooltip || item.label}>
            {item.icon && <item.icon className="w-5 h-5" />}
          </div>
        </Link>
      )
    }

    if (hasChildren) {
      return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div className={`${baseClasses} justify-between px-3 py-2`} style={buttonStyles}>
              <div className="flex items-center space-x-3" title={item.tooltip || item.label}>
                {item.icon && <item.icon className="w-5 h-5" />}
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1">
              {item.children?.map((child, index) => (
                <MenuItem
                  key={`${child.href}-${index}`}
                  item={child as MenuItem}
                  level={level + 1}
                  isCollapsed={isCollapsed}
                  pathname={pathname}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
    }

    return (
      <Link href={normalizeHref(item.href)} className="block">
        <div className={`${baseClasses} space-x-3 px-3 py-2`} style={buttonStyles} title={item.tooltip || item.label}>
          {item.icon && <item.icon className="w-5 h-5" />}
          <span className="text-sm font-medium">{item.label}</span>
        </div>
      </Link>
    )
  },
)

MenuItem.displayName = "MenuItem"

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cookies = useCookies()
  const role = cookies.get("role")

  // Memoize the fetch function to prevent unnecessary re-creation
  const fetchMenu = useCallback(async () => {
    if (!role) {
      setError("No role found. Please log in.")
      setIsLoading(false)
      router.push("/login")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/roles/get-menu?role=${role}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("access_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.menu?.items || !Array.isArray(data.menu.items)) {
        throw new Error("Invalid menu items in response")
      }

      // Map API menu items recursively
      const mappedMenus = data.menu.items.map(mapApiMenuToMenuItem)
      setMenuItems(mappedMenus)
    } catch (error) {
      console.error("Error fetching menu:", error)
      setError("Failed to load menu. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [role, cookies, router])

  // Fetch menu data when role or cookies change
  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  // Separate effect for redirecting to first menu item if on /dashboard
  useEffect(() => {
    if (menuItems.length > 0 && pathname === "/dashboard") {
      const firstLink = menuItems[0].href
      router.push(normalizeHref(firstLink))
    }
  }, [menuItems, pathname, router])

  // Memoize the toggle button classes
  const toggleButtonClasses = useMemo(
    () => "relative rounded-full h-8 w-8 left-8 bg-orange hover:bg-magenta transition-colors duration-200",
    [],
  )

  // Memoize the chevron rotation class
  const chevronClasses = useMemo(
    () => `w-6 h-6 text-white transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`,
    [isCollapsed],
  )

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isCollapsed ? "w-24" : "w-64"
        }`}
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
        <Button variant="ghost" size="sm" onClick={onToggle} className={toggleButtonClasses}>
          <ChevronRight className={chevronClasses} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {isLoading && <Dashboard_Loading />}
        {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded-lg">{error}</div>}
        {!isLoading && !error && menuItems.length === 0 && (
          <div className="text-gray-500 text-sm p-2">No menu items available.</div>
        )}
        {menuItems.map((item, index) => (
          <MenuItem key={`${item.href}-${index}`} item={item} level={0} isCollapsed={isCollapsed} pathname={pathname} />
        ))}
      </nav>
    </div>
  )
}