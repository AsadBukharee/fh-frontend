"use client"

import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  GripVertical,
  UserPlus,
  Building2,
  Truck,
  ClipboardCheck,
  Fuel,
  LifeBuoy,
  Stethoscope,
  Car,
  ShieldCheck,
  BookUser,
  CalendarCheck,
  Clock,
  LogIn,
  RefreshCw,
  FileText,
  ClipboardList,
  Activity,
  UserCheck,
  Book,
  Wrench,
  Database,
  CalendarX,
  User,
  MoreHorizontal,
  BookOpen,
  File,
  SquareCheckBig,
  CalendarClock,
  Bell,
  BarChart3,
  TowerControl,
  Headset,
  Save,
  Filter,
  type LucideIcon,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/app/Context/ToastContext"
import GradientButton from "@/app/utils/GradientButton"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useCookies } from "next-client-cookies"
import AnimatedLogo from "@/components/LogoLoading"
import React from "react"
import API_URL from "@/app/utils/ENV"

// ============= STATIC CONSTANTS (moved outside component) =============
const PERMISSION_ICONS = {
  view: Eye,
  create: Plus,
  update: Edit,
  delete: Trash2,
} as const

const LUCIDE_ICON_MAP: { [key: string]: LucideIcon } = {
  UserPlus,
  Building2,
  Truck,
  ClipboardCheck,
  Fuel,
  LifeBuoy,
  Stethoscope,
  Car,
  ShieldCheck,
  BookUser,
  CalendarCheck,
  Clock,
  LogIn,
  RefreshCw,
  FileText,
  ClipboardList,
  Activity,
  UserCheck,
  Book,
  Wrench,
  Database,
  CalendarX,
  User,
  MoreHorizontal,
  BookOpen,
  File,
  SquareCheckBig,
  CalendarClock,
  Bell,
  BarChart3,
  TowerControl,
  Headset,
}

const AVAILABLE_ICONS = Object.keys(LUCIDE_ICON_MAP)

const INITIAL_MENU_ITEMS = [
  {
    nav: "/users",
    icon: "UserPlus",
    name: "User Management",
    tooltip: "Manage users and permissions",
    children: [],
    isSelected: true,
  },
  {
    nav: "/sites",
    icon: "Building2",
    name: "Sites",
    tooltip: "Manage operational sites",
    children: [],
    isSelected: true,
  },
  {
    nav: "/vehicles",
    icon: "Truck",
    name: "Vehicles",
    tooltip: "Vehicle dashboard and tools",
    isSelected: true,
    children: [
      {
        nav: "/vehicles/walkaround",
        icon: "ClipboardCheck",
        name: "Walkaround",
        tooltip: "Walkaround inspection checks",
        children: [],
        isSelected: true,
      },
      {
        nav: "/vehicles/fuel-checks",
        icon: "Fuel",
        name: "Fuel Checks",
        tooltip: "Vehicle fuel checks and logs",
        children: [],
        isSelected: true,
      },
      {
        nav: "/vehicles/tyre-checks",
        icon: "LifeBuoy",
        name: "Tyre Checks",
        tooltip: "Tyre condition and tread inspections",
        children: [],
        isSelected: true,
      },
      {
        nav: "/vehicles/equipment-checks",
        icon: "Stethoscope",
        name: "Equipment Checks",
        tooltip: "Onboard equipment inspections",
        children: [],
        isSelected: true,
      },
      {
        nav: "/vehicles/valet-checks",
        icon: "Car",
        name: "Valet Checks",
        tooltip: "Vehicle cleanliness & valet review",
        isSelected: true,
        children: [
          {
            nav: "/vehicles/valet-checks/gatekeeper",
            icon: "ShieldCheck",
            name: "Gate Keeper Checks",
            tooltip: "Final checks at site gate",
            children: [],
            isSelected: true,
          },
        ],
      },
    ],
  },
  // ... truncated for brevity, but include all menu items
]

// ============= TYPES =============
type Permission = { view: boolean; create: boolean; update: boolean; delete: boolean }
type Resource = { id: number; name: string }
type UserPermissions = { [key: string]: Permission }
type MenuItem = { nav: string; icon: string; name: string; tooltip: string; children: MenuItem[]; isSelected: boolean }
type UserData = { id: number; type: string; permissions: UserPermissions; menu: { items: MenuItem[] } }
type ApiRole = { id: number; name: string; menu: { items: MenuItem[] }; permissions: { [key: string]: Permission } }
type ApiResponse = { success: boolean; message: string; data: { resources: Resource[]; roles: ApiRole[] } }

// ============= OPTIMIZED PERMISSION CELL COMPONENT =============
const PermissionCell = memo(
  ({
    userId,
    resource,
    permissions,
    onToggle,
  }: {
    userId: number
    resource: string
    permissions: Permission
    onToggle: (userId: number, resource: string, permission: string) => void
  }) => {
    const handleToggle = useCallback(
      (permKey: string) => {
        onToggle(userId, resource, permKey)
      },
      [userId, resource, onToggle],
    )

    return (
      <div className="flex gap-2 justify-center">
        {Object.entries(PERMISSION_ICONS).map(([permKey, IconComponent]) => {
          const isActive = permissions[permKey as keyof Permission]
          return (
            <button
              key={permKey}
              onClick={() => handleToggle(permKey)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-white border-[1px] border-[#E12B47] text-[#E12B47] shadow-md"
                  : "bg-white text-gray-500 border-[1px] border-gray-300 hover:bg-gray-200"
              }`}
              title={permKey.charAt(0).toUpperCase() + permKey.slice(1)}
              aria-label={`${permKey} permission for ${resource}`}
            >
              <IconComponent size={14} />
            </button>
          )
        })}
      </div>
    )
  },
)
PermissionCell.displayName = "PermissionCell"

// ============= OPTIMIZED MENU ITEM COMPONENT =============
const MenuItemComponent = memo(
  ({
    item,
    index,
    moveItem,
    parentIndex = null,
    toggleMenuItem,
    addChildItem,
    updateMenuItem,
    removeMenuItem,
  }: {
    item: MenuItem
    index: number
    parentIndex?: number | null
    moveItem: (dragIndex: number, hoverIndex: number, parentIndex: number | null) => void
    toggleMenuItem: (index: number, parentIndex: number | null) => void
    addChildItem: (parentIndex: number | null, index: number) => void
    updateMenuItem: (index: number, parentIndex: number | null, updates: Partial<MenuItem>) => void
    removeMenuItem: (index: number, parentIndex: number | null) => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const [, drop] = useDrop({
      accept: "MENU_ITEM",
      hover: (draggedItem: { index: number; parentIndex: number | null }) => {
        if (draggedItem.index === index && draggedItem.parentIndex === parentIndex) return
        moveItem(draggedItem.index, index, parentIndex)
        draggedItem.index = index
        draggedItem.parentIndex = parentIndex
      },
    })

    const [{ isDragging }, drag] = useDrag({
      type: "MENU_ITEM",
      item: { index, parentIndex },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    })

    const IconComponent = LUCIDE_ICON_MAP[item.icon] || File

    const handleDoubleClick = useCallback(() => setIsEditing(true), [])
    const handleBlur = useCallback((event: React.FocusEvent) => {
      const relatedTarget = event.relatedTarget as Node | null
      if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) return
      setIsEditing(false)
    }, [])

    const handleIconChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value
        updateMenuItem(index, parentIndex, { icon: LUCIDE_ICON_MAP[value] ? value : "File" })
      },
      [index, parentIndex, updateMenuItem],
    )

    const handleToggle = useCallback(() => {
      toggleMenuItem(index, parentIndex)
    }, [index, parentIndex, toggleMenuItem])

    const handleAddChild = useCallback(() => {
      addChildItem(parentIndex, index)
    }, [parentIndex, index, addChildItem])

    const handleRemove = useCallback(() => {
      removeMenuItem(index, parentIndex)
    }, [index, parentIndex, removeMenuItem])

    const handleNameChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMenuItem(index, parentIndex, { name: e.target.value, tooltip: e.target.value })
      },
      [index, parentIndex, updateMenuItem],
    )

    const ref = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node
        drag(drop(node))
      },
      [drag, drop],
    )

    return (
      <div
        ref={ref}
        className={`relative flex items-center w-[500px] h-[50px] gap-2 p-2 my-1 rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
          isDragging ? "opacity-50 border-blue-400 shadow-lg" : "hover:border-blue-300 hover:shadow-md"
        }`}
        onDoubleClick={handleDoubleClick}
        tabIndex={0}
        role="listitem"
        aria-label={`Menu item: ${item.name}`}
      >
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0" />
        <Checkbox checked={item.isSelected} onCheckedChange={handleToggle} className="mr-2" />

        {isEditing ? (
          <>
            <select
              value={LUCIDE_ICON_MAP[item.icon] ? item.icon : "File"}
              onChange={handleIconChange}
              className="w-[120px] h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <Input value={item.name} onChange={handleNameChange} onBlur={handleBlur} className="flex-1" autoFocus />
          </>
        ) : (
          <>
            <IconComponent className="h-4 w-4 text-gray-600 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
          </>
        )}

        <button onClick={handleAddChild} className="p-1 rounded-full hover:bg-gray-100" title="Add child item">
          <Plus className="h-4 w-4 text-gray-500" />
        </button>
        <button onClick={handleRemove} className="p-1 rounded-full hover:bg-red-100" title="Remove item">
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>

        {item.children && item.children.length > 0 && (
          <div className="absolute right-18 top-1/2 -translate-y-1/2 text-xs text-gray-500">
            ({item.children.length} sub-items)
          </div>
        )}
      </div>
    )
  },
)
MenuItemComponent.displayName = "MenuItemComponent"

// ============= MAIN COMPONENT WITH OPTIMIZATIONS =============
export default function UsersPageOptimized() {
  // ============= STATE =============
  const [data, setData] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [newRoleName, setNewRoleName] = useState("")
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null)
  const [modifiedPermissions, setModifiedPermissions] = useState<{ [key: number]: UserPermissions }>({})
  const [originalPermissions, setOriginalPermissions] = useState<{ [key: number]: UserPermissions }>({})
  const [isSaving, setIsSaving] = useState<{ [key: number]: boolean }>({})
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [tempSelectedResources, setTempSelectedResources] = useState<string[]>([])
  const [resourceSearch, setResourceSearch] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
console.log(editingRoleId,originalPermissions)
  const { showToast } = useToast()
  const cookies = useCookies()
  const token = cookies.get("access_token")

  // ============= MEMOIZED VALUES =============
  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>()
    resources.forEach((resource) => {
      map.set(resource.name.toLowerCase(), resource)
    })
    return map
  }, [resources])

  const filteredResources = useMemo(
    () => resources.filter((resource) => resource.name.toLowerCase().includes(resourceSearch.toLowerCase())),
    [resources, resourceSearch],
  )

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data

    const searchLower = searchTerm.toLowerCase()
    return data.filter((user) => {
      // Fast string matching
      if (user.type.toLowerCase().includes(searchLower)) return true

      // Deep search in menu items (optimized)
      const searchInItems = (items: MenuItem[]): boolean => {
        for (const item of items) {
          if (item.name.toLowerCase().includes(searchLower)) return true
          if (item.children.length > 0 && searchInItems(item.children)) return true
        }
        return false
      }

      return searchInItems(user.menu.items)
    })
  }, [data, searchTerm])

  // ============= DEBOUNCED SEARCH =============
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const debouncedSetSearchTerm = useCallback((value: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(value)
    }, 300)
  }, [])

  // ============= API FUNCTIONS =============
  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_URL}/permissions/matrix/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch roles")

      const apiResponse: ApiResponse = await response.json()
      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.message || "Invalid API response")
      }

      const { resources, roles } = apiResponse.data
      setResources(resources || [])

      const resourceNames = resources.map((r) => r.name.toLowerCase())
      setSelectedResources(resourceNames)
      setTempSelectedResources(resourceNames)

      // Batch state updates
      const mappedData: UserData[] = roles.map((role) => ({
        id: role.id,
        type: role.name,
        permissions: Object.keys(role.permissions).reduce((acc, resource) => {
          acc[resource] = {
            view: role.permissions[resource]?.view ?? false,
            create: role.permissions[resource]?.create ?? false,
            update: role.permissions[resource]?.update ?? false,
            delete: role.permissions[resource]?.delete ?? false,
          }
          return acc
        }, {} as UserPermissions),
        menu: { items: role.menu?.items ?? [] },
      }))

      const initialPermissions = roles.reduce(
        (acc, role) => {
          acc[role.id] = Object.keys(role.permissions).reduce((permAcc, resource) => {
            permAcc[resource] = {
              view: role.permissions[resource]?.view ?? false,
              create: role.permissions[resource]?.create ?? false,
              update: role.permissions[resource]?.update ?? false,
              delete: role.permissions[resource]?.delete ?? false,
            }
            return permAcc
          }, {} as UserPermissions)
          return acc
        },
        {} as { [key: number]: UserPermissions },
      )

      // Batch all state updates
      setOriginalPermissions(initialPermissions)
      setData(mappedData)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "An error occurred while fetching roles", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast, token])

  // ============= OPTIMIZED EVENT HANDLERS =============
  const togglePermission = useCallback(
    (id: number, resource: string, permission: string) => {
      // Optimized state update using functional update
      setData((prev) =>
        prev.map((user) => {
          if (user.id !== id) return user

          const currentPermission = user.permissions[resource]?.[permission as keyof Permission] ?? false
          return {
            ...user,
            permissions: {
              ...user.permissions,
              [resource]: {
                ...user.permissions[resource],
                [permission]: !currentPermission,
              },
            },
          }
        }),
      )

      // Update modified permissions
      setModifiedPermissions((prev) => {
        const user = data.find((u) => u.id === id)
        if (!user) return prev

        const currentPermission = user.permissions[resource]?.[permission as keyof Permission] ?? false
        return {
          ...prev,
          [id]: {
            ...prev[id],
            [resource]: {
              ...user.permissions[resource],
              [permission]: !currentPermission,
            },
          },
        }
      })
    },
    [data],
  )

  const savePermissions = useCallback(
    async (roleId: number) => {
      const modified = modifiedPermissions[roleId]
      if (!modified) {
        showToast("No changes to save.", "info")
        return
      }

      setIsSaving((prev) => ({ ...prev, [roleId]: true }))
      try {
        const payload = Object.keys(modified).map((resourceName) => {
          const resource = resourceMap.get(resourceName.toLowerCase())
          if (!resource) throw new Error(`Resource ${resourceName} not found`)

          return {
            role: roleId,
            resource: resource.id,
            actions: modified[resourceName],
          }
        })

        const response = await fetch(`${API_URL}/permissions/bulk/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || errorData.message || "Failed to update permissions")
        }

        // Batch state updates
        setOriginalPermissions((prev) => ({ ...prev, [roleId]: modified }))
        setModifiedPermissions((prev) => {
          const newModified = { ...prev }
          delete newModified[roleId]
          return newModified
        })

        showToast("Permissions updated successfully!", "success")
      } catch (error) {
        showToast(error instanceof Error ? error.message : "An error occurred while updating permissions", "error")
      } finally {
        setIsSaving((prev) => ({ ...prev, [roleId]: false }))
      }
    },
    [modifiedPermissions, resourceMap, token, showToast],
  )

  // ============= MENU ITEM HANDLERS (OPTIMIZED) =============
  const toggleMenuItem = useCallback((index: number, parentIndex: number | null) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        const currentSelection = !newItems[index].isSelected
        newItems[index] = {
          ...newItems[index],
          isSelected: currentSelection,
          children: newItems[index].children.map((child) => ({
            ...child,
            isSelected: currentSelection,
          })),
        }
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.map((child, i) =>
            i === index
              ? {
                  ...child,
                  isSelected: !child.isSelected,
                  children: child.children.map((subChild) => ({
                    ...subChild,
                    isSelected: !child.isSelected,
                  })),
                }
              : child,
          ),
        }

        const hasSelectedChild = newItems[parentIndex].children.some((child) => child.isSelected)
        newItems[parentIndex].isSelected = hasSelectedChild
      }
      return newItems
    })
  }, [])

  const addChildItem = useCallback((parentIndex: number | null, index: number) => {
    const newChild: MenuItem = {
      nav: `/new-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      icon: "File",
      name: "New Item",
      tooltip: "New menu item",
      children: [],
      isSelected: true,
    }

    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        newItems[index] = {
          ...newItems[index],
          children: [...newItems[index].children, newChild],
        }
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.map((child, i) =>
            i === index ? { ...child, children: [...child.children, newChild] } : child,
          ),
        }
      }
      return newItems
    })
  }, [])

  const updateMenuItem = useCallback((index: number, parentIndex: number | null, updates: Partial<MenuItem>) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        newItems[index] = { ...newItems[index], ...updates }
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.map((child, i) => (i === index ? { ...child, ...updates } : child)),
        }
      }
      return newItems
    })
  }, [])

  const removeMenuItem = useCallback((index: number, parentIndex: number | null) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return

    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        newItems.splice(index, 1)
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.filter((_, i) => i !== index),
        }
      }
      return newItems
    })
  }, [])

  const moveItem = useCallback((dragIndex: number, hoverIndex: number, parentIndex: number | null) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        if (dragIndex < 0 || dragIndex >= newItems.length || hoverIndex < 0 || hoverIndex >= newItems.length) {
          return newItems
        }
        const [draggedItem] = newItems.splice(dragIndex, 1)
        newItems.splice(hoverIndex, 0, draggedItem)
      } else {
        const children = newItems[parentIndex].children
        if (dragIndex < 0 || dragIndex >= children.length || hoverIndex < 0 || hoverIndex >= children.length) {
          return newItems
        }
        const newChildren = [...children]
        const [draggedChild] = newChildren.splice(dragIndex, 1)
        newChildren.splice(hoverIndex, 0, draggedChild)
        newItems[parentIndex] = { ...newItems[parentIndex], children: newChildren }
      }
      return newItems
    })
  }, [])

  // ============= FILTER HANDLERS =============
  const handleCheckAll = useCallback(() => {
    setTempSelectedResources(resources.map((r) => r.name.toLowerCase()))
  }, [resources])

  const handleUncheckAll = useCallback(() => {
    setTempSelectedResources([])
  }, [])

  const handleApplyFilter = useCallback(() => {
    setSelectedResources(tempSelectedResources)
    setIsDropdownOpen(false)
  }, [tempSelectedResources])

  const handleTempResourceToggle = useCallback((resourceName: string) => {
    setTempSelectedResources((prev) =>
      prev.includes(resourceName) ? prev.filter((r) => r !== resourceName) : [...prev, resourceName],
    )
  }, [])

  // ============= ROLE MANAGEMENT =============
  const handleAddUser = useCallback(async () => {
    if (newRoleName.trim() === "") {
      showToast("Please enter a role name!", "error")
      return
    }

    const selectedMenuItems = menuItems
      .filter((item) => item.isSelected)
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => child.isSelected),
      }))

    const payload = {
      name: newRoleName,
      menu: { items: selectedMenuItems },
      permissions: { site: { view: false, create: false, update: false, delete: false } },
    }

    try {
      const response = await fetch(`${API_URL}/roles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.message || "Failed to add role")
      }

      await fetchRoles()
      setNewRoleName("")
      setIsDialogOpen(false)
      setDialogMode("add")
      showToast("New role added successfully!", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "An error occurred while adding the role", "error")
    }
  }, [newRoleName, menuItems, showToast, token, fetchRoles])

  const handleEditRole = useCallback((role: UserData) => {
    setDialogMode("edit")
    setEditingRoleId(role.id)
    setNewRoleName(role.type)
    setMenuItems(role.menu.items.length > 0 ? role.menu.items : INITIAL_MENU_ITEMS)
    setIsDialogOpen(true)
  }, [])

  const handleDeleteRole = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${API_URL}/roles/${id}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || errorData.message || "Failed to delete role")
        }

        // Batch state updates
        setData((prev) => prev.filter((user) => user.id !== id))
        setOriginalPermissions((prev) => {
          const newPermissions = { ...prev }
          delete newPermissions[id]
          return newPermissions
        })
        setModifiedPermissions((prev) => {
          const newModified = { ...prev }
          delete newModified[id]
          return newModified
        })

        showToast("Role deleted successfully!", "success")
      } catch (error) {
        showToast(error instanceof Error ? error.message : "An error occurred while deleting the role", "error")
      }
    },
    [showToast, token],
  )

  const handleOpenConfirmDialog = useCallback((id: number) => {
    setRoleToDelete(id)
    setIsConfirmDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (roleToDelete !== null) {
      await handleDeleteRole(roleToDelete)
      setIsConfirmDialogOpen(false)
      setRoleToDelete(null)
    }
  }, [roleToDelete, handleDeleteRole])

  // ============= RENDER FUNCTIONS =============
  const renderMenuItems = useCallback(
    (items: MenuItem[], parentIndex: number | null = null) => {
      return items.map((item, index) => (
        <React.Fragment key={item.nav}>
          <MenuItemComponent
            item={item}
            index={index}
            moveItem={moveItem}
            parentIndex={parentIndex}
            toggleMenuItem={toggleMenuItem}
            addChildItem={addChildItem}
            updateMenuItem={updateMenuItem}
            removeMenuItem={removeMenuItem}
          />
          {item.children && item.children.length > 0 && (
            <div className="border-l border-gray-200 ml-8 pl-2">
              {renderMenuItems(item.children, parentIndex === null ? index : parentIndex)}
            </div>
          )}
        </React.Fragment>
      ))
    },
    [moveItem, toggleMenuItem, addChildItem, updateMenuItem, removeMenuItem],
  )

  // ============= EFFECTS =============
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // ============= RENDER =============
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-4 sm:px-6 py-6 space-y-6 bg-gray-50 min-h-screen">
        {isLoading ? (
          <AnimatedLogo />
        ) : (
          <>
            {/* Header with Search and Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 gradient-border cursor-glow">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                  <Input
                    onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                    placeholder="Search roles or menu items"
                    className="pl-10 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Resource Filter Dropdown */}
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                      <Filter className="h-4 w-4" />
                      Filter Resources
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-4 bg-white">
                    <div className="mb-2">
                      <Input
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                        placeholder="Search resources..."
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button variant="outline" onClick={handleCheckAll} className="flex-1 bg-transparent">
                        Check All
                      </Button>
                      <Button variant="outline" onClick={handleUncheckAll} className="flex-1 bg-transparent">
                        Uncheck All
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredResources.map((resource) => (
                        <DropdownMenuItem
                          key={resource.id}
                          asChild
                          className="cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={tempSelectedResources.includes(resource.name.toLowerCase())}
                              onCheckedChange={() => handleTempResourceToggle(resource.name.toLowerCase())}
                              id={`resource-${resource.id}`}
                            />
                            <label htmlFor={`resource-${resource.id}`} className="flex-1 capitalize cursor-pointer">
                              {resource.name}
                            </label>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Button
                        onClick={handleApplyFilter}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <GradientButton
                text="Add Role"
                Icon={Plus}
                width="180px"
                onClick={() => {
                  setDialogMode("add")
                  setNewRoleName("")
                  setMenuItems(INITIAL_MENU_ITEMS)
                  setIsDialogOpen(true)
                }}
              />
            </div>

            {/* Optimized Table */}
            <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm gradient-border cursor-glow">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gray-50">
                    <TableHead className="w-[50px]">Sr No.</TableHead>
                    <TableHead className="w-[150px]">Role Type</TableHead>
                    {selectedResources.map((module) => (
                      <TableHead key={module} className="text-center capitalize">
                        {module} Permissions
                      </TableHead>
                    ))}
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 border-1 border-gray-200">
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>
                          <Badge className="px-3 py-1 text-sm bg-transparent hover:bg-transparent font-medium text-gray-700">
                            {user.type}
                          </Badge>
                        </TableCell>
                        {selectedResources.map((module) => (
                          <TableCell key={module}>
                            <PermissionCell
                              userId={user.id}
                              resource={module}
                              permissions={
                                user.permissions[module] ?? {
                                  view: false,
                                  create: false,
                                  update: false,
                                  delete: false,
                                }
                              }
                              onToggle={togglePermission}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => savePermissions(user.id)}
                              disabled={!modifiedPermissions[user.id] || isSaving[user.id]}
                              className={`p-1 rounded-full ${
                                modifiedPermissions[user.id] && !isSaving[user.id]
                                  ? "hover:bg-green-100 text-green-600"
                                  : "text-gray-400 cursor-not-allowed"
                              }`}
                              title="Save permissions"
                            >
                              {isSaving[user.id] ? <AnimatedLogo /> : <Save className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleEditRole(user)}
                              className="p-1 rounded-full hover:bg-blue-100"
                              title="Edit role"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => handleOpenConfirmDialog(user.id)}
                              className="p-1 rounded-full hover:bg-red-100"
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2 + selectedResources.length + 1} className="text-center py-8 text-gray-400">
                        No roles found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Add/Edit Role Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-2xl p-6 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    {dialogMode === "add" ? "Add New Role" : "Edit Role"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label htmlFor="role-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Role Name
                    </label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Manager, Driver, Guest"
                      className="w-full border-gray-300 focus-visible:ring-blue-500 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">
                      Menu Configuration (Drag or use arrow keys to reorder)
                    </h3>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {renderMenuItems(menuItems)}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setDialogMode("add")
                      setNewRoleName("")
                      setMenuItems(INITIAL_MENU_ITEMS)
                      setEditingRoleId(null)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={dialogMode === "add" ? handleAddUser : handleAddUser}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {dialogMode === "add" ? "Add Role" : "Update Role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
              <DialogContent className="sm:max-w-md p-6 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-800">Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-600">
                    Are you sure you want to delete this role? This action cannot be undone.
                  </p>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsConfirmDialogOpen(false)
                      setRoleToDelete(null)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </DndProvider>
  )
}
