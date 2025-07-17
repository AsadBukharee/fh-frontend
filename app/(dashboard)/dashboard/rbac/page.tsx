'use client'
import { useState, useCallback, memo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, PencilLine, Trash2, Search, Plus, GripVertical, UserPlus, Building2, Truck, ClipboardCheck, Fuel, LifeBuoy, Stethoscope, Car, ShieldCheck, BookUser, CalendarCheck, Clock, LogIn, RefreshCw, FileText, ClipboardList, Activity, UserCheck, Book, Wrench, Database, ListIcon as ListNumbers, CalendarX, User, MoreHorizontal, BookOpen, File, SquareCheckBig, CalendarClock, Bell, type LucideIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/app/Context/ToastContext"
import GradientButton from "@/app/utils/GradientButton"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import React from "react"

// Define types
type Permission = {
  view: boolean
  edit: boolean
  write: boolean
  delete: boolean
}
type UserPermissions = {
  [key: string]: Permission
}
type UserData = {
  id: number
  type: string
  permissions: UserPermissions
}
type MenuItem = {
  nav: string
  icon: string
  name: string
  tooltip: string
  children: MenuItem[]
  isSelected: boolean
}
type MenuConfig = {
  role: string
  menu: {
    items: MenuItem[]
  }
  description: string
}

// Initial menu configuration
const initialMenu: MenuConfig = {
  role: "Global",
  menu: {
    items: [
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
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: "/staff",
        icon: "BookUser",
        name: "Staff",
        tooltip: "Staff records and schedules",
        children: [
          {
            nav: "/staff/duty-logs",
            icon: "CalendarCheck",
            name: "Daily Duty Logs",
            tooltip: "Daily staff duty logs",
            children: [],
            isSelected: true,
          },
          {
            nav: "/staff/wtd-logs",
            icon: "Clock",
            name: "WTD Logs",
            tooltip: "Working Time Directive logs",
            children: [],
            isSelected: true,
          },
          {
            nav: "/staff/clocking",
            icon: "LogIn",
            name: "Clocking Logs",
            tooltip: "Clock-in / Clock-out entries",
            children: [],
            isSelected: true,
          },
          {
            nav: "/staff/rotas",
            icon: "RefreshCw",
            name: "Rotas",
            tooltip: "Weekly rota planning",
            children: [],
            isSelected: true,
          },
          {
            nav: "/staff/contracts",
            icon: "FileText",
            name: "Contracts",
            tooltip: "Staff contract records",
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: "/inspections",
        icon: "ClipboardList",
        name: "MOTs & Insp.",
        tooltip: "MOTs & Inspections",
        children: [
          {
            nav: "/inspections/maintenance-pmi",
            icon: "Activity",
            name: "Maintenance PMI",
            tooltip: "Maintenance PMI Analysis",
            children: [],
            isSelected: true,
          },
          {
            nav: "/inspections/driver-pmi",
            icon: "UserCheck",
            name: "Driver PMI",
            tooltip: "Driver PMI Analysis",
            children: [],
            isSelected: true,
          },
          {
            nav: "/inspections/service-history",
            icon: "Book",
            name: "Service History",
            tooltip: "Service and inspection history",
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: "/mechanic-jobs",
        icon: "Wrench",
        name: "Mechanic",
        tooltip: "Mechanic Jobs",
        children: [],
        isSelected: true,
      },
      {
        nav: "/su-transport",
        icon: "Database",
        name: "SU Transport Data",
        tooltip: "Special unit transport logs",
        children: [
          {
            nav: "/su-transport/numbers",
            icon: "ListNumbers",
            name: "SU Numbers Screen",
            tooltip: "Show SU Numbers",
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: "/audit-expiry",
        icon: "CalendarX",
        name: "Audit Expiry",
        tooltip: "Audit Expiry Dates",
        children: [
          {
            nav: "/audit-expiry/vehicles",
            icon: "Truck",
            name: "Vehicles",
            tooltip: "Audit Expiry Dates for Vehicles",
            children: [],
            isSelected: true,
          },
          {
            nav: "/audit-expiry/drivers",
            icon: "User",
            name: "Drivers",
            tooltip: "Audit Expiry Dates for Drivers",
            children: [],
            isSelected: true,
          },
          {
            nav: "/audit-expiry/others",
            icon: "MoreHorizontal",
            name: "Others",
            tooltip: "Audit Expiry Dates for Others",
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: "/knowledge",
        icon: "BookOpen",
        name: "Knowledge",
        tooltip: "Knowledge Library",
        children: [],
        isSelected: true,
      },
      {
        nav: "/documents",
        icon: "File",
        name: "Documents",
        tooltip: "Document Lists",
        children: [],
        isSelected: true,
      },
      {
        nav: "/tasks",
        icon: "SquareCheckBig",
        name: "Outstanding Tasks",
        tooltip: "Outstanding Tasks",
        children: [],
        isSelected: true,
      },
      {
        nav: "/reminders",
        icon: "CalendarClock",
        name: "Reminders",
        tooltip: "Reminders",
        children: [],
        isSelected: true,
      },
      {
        nav: "/notifications",
        icon: "Bell",
        name: "Notifications",
        tooltip: "All notifications",
        children: [],
        isSelected: true,
      },
    ],
  },
  description: "Global menu configuration",
}

// Sample user data
const userData: UserData[] = [
  {
    id: 1,
    type: "Admin",
    permissions: {
      site: { view: true, edit: true, write: true, delete: true },
      dashboard: { view: true, edit: true, write: true, delete: true },
      cars: { view: true, edit: true, write: true, delete: true },
    },
  },
  {
    id: 2,
    type: "Editor",
    permissions: {
      site: { view: true, edit: true, write: true, delete: false },
      dashboard: { view: true, edit: false, write: false, delete: false },
      cars: { view: true, edit: false, write: false, delete: false },
    },
  },
  {
    id: 3,
    type: "Viewer",
    permissions: {
      site: { view: true, edit: false, write: false, delete: false },
      dashboard: { view: true, edit: false, write: false, delete: false },
      cars: { view: true, edit: false, write: false, delete: false },
    },
  },
]

// Icons for permissions
const permissionIcons = {
  view: Eye,
  edit: Edit,
  write: PencilLine,
  delete: Trash2,
}

// Map string icon names to Lucide React components
const LucideIconMap: { [key: string]: LucideIcon } = {
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
  ListNumbers,
  CalendarX,
  User,
  MoreHorizontal,
  BookOpen,
  File,
  SquareCheckBig,
  CalendarClock,
  Bell,
}

// Available icons for selection
const availableIcons = Object.keys(LucideIconMap)

// Draggable Menu Item Component
const MenuItemComponent = memo(({
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
  moveItem: (dragIndex: number, hoverIndex: number, parentIndex: number | null) => void
  parentIndex?: number | null
  toggleMenuItem: (index: number, parentIndex: number | null) => void
  addChildItem: (parentIndex: number | null, index: number) => void
  updateMenuItem: (index: number, parentIndex: number | null, updates: Partial<MenuItem>) => void
  removeMenuItem: (index: number, parentIndex: number | null) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [, drop] = useDrop({
    accept: 'MENU_ITEM',
    hover: (draggedItem: { index: number, parentIndex: number | null }) => {
      if (draggedItem.index === index && draggedItem.parentIndex === parentIndex) {
        return
      }
      moveItem(draggedItem.index, index, parentIndex)
      draggedItem.index = index
      draggedItem.parentIndex = parentIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: { index, parentIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const IconComponent = LucideIconMap[item.icon] || File // Fallback to File icon if not found

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  const ref = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={ref}
      className={`relative flex items-center w-[500px] gap-2 p-2 my-1 rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
        isDragging ? 'opacity-50 border-blue-400 shadow-lg' : 'hover:border-blue-300 hover:shadow-md'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0" />
      <Checkbox
        checked={item.isSelected}
        onCheckedChange={() => toggleMenuItem(index, parentIndex)}
        className="mr-2"
      />
      {isEditing ? (
        <>
          <Select
            value={item.icon}
            onValueChange={(value) => updateMenuItem(index, parentIndex, { icon: value })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableIcons.map((icon) => (
                <SelectItem key={icon} value={icon}>
                  {icon}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={item.name}
            onChange={(e) => updateMenuItem(index, parentIndex, { 
              name: e.target.value,
              tooltip: e.target.value 
            })}
            onBlur={handleBlur}
            className="flex-1"
            autoFocus
          />
        </>
      ) : (
        <>
          {IconComponent && <IconComponent className="h-4 w-4 text-gray-600 shrink-0" />}
          <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
        </>
      )}
      <button
        onClick={() => addChildItem(parentIndex, index)}
        className="p-1 rounded-full hover:bg-gray-100"
        title="Add child item"
      >
        <Plus className="h-4 w-4 text-gray-500" />
      </button>
      <button
        onClick={() => removeMenuItem(index, parentIndex)}
        className="p-1 rounded-full hover:bg-red-100"
        title="Remove item"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>
      {item.children && item.children.length > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          ({item.children.length} sub-items)
        </div>
      )}
    </div>
  )
})
MenuItemComponent.displayName = "MenuItemComponent"

export default function UsersPage() {
  const [data, setData] = useState<UserData[]>(userData)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu.menu.items)
  const { showToast } = useToast()

  const togglePermission = useCallback((id: number, module: string, permission: string) => {
    setData((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              permissions: {
                ...user.permissions,
                [module]: {
                  ...user.permissions[module],
                  [permission]: !user.permissions[module][permission as keyof Permission],
                },
              },
            }
          : user
      )
    )
  }, [])

  const toggleMenuItem = useCallback((index: number, parentIndex: number | null) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        newItems[index] = {
          ...newItems[index],
          isSelected: !newItems[index].isSelected,
          children: newItems[index].children.map(child => ({
            ...child,
            isSelected: !newItems[index].isSelected
          }))
        }
        console.log(`Toggled top-level item: ${newItems[index].name}, isSelected: ${newItems[index].isSelected}`)
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.map((child, i) =>
            i === index
              ? {
                  ...child,
                  isSelected: !child.isSelected,
                  children: child.children.map(subChild => ({
                    ...subChild,
                    isSelected: !child.isSelected
                  }))
                }
              : child
          )
        }
        console.log(`Toggled child item: ${newItems[parentIndex].children[index].name}, isSelected: ${newItems[parentIndex].children[index].isSelected}`)
      }
      return newItems
    })
  }, [])

  const addChildItem = useCallback((parentIndex: number | null, index: number) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      const newChild: MenuItem = {
        nav: `/new-item-${Date.now()}`,
        icon: "File",
        name: "New Item",
        tooltip: "New menu item",
        children: [],
        isSelected: true,
      }

      if (parentIndex === null) {
        newItems[index] = {
          ...newItems[index],
          children: [...newItems[index].children, newChild]
        }
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: [...newItems[parentIndex].children].map((child, i) =>
            i === index ? { ...child, children: [...child.children, newChild] } : child
          )
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
          children: newItems[parentIndex].children.map((child, i) =>
            i === index ? { ...child, ...updates } : child
          )
        }
      }
      return newItems
    })
  }, [])

  const removeMenuItem = useCallback((index: number, parentIndex: number | null) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems]
      if (parentIndex === null) {
        newItems.splice(index, 1)
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.filter((_, i) => i !== index)
        }
      }
      return newItems
    })
  }, [])

  const renderPermissions = useCallback((userId: number, module: string, permissions: Record<string, boolean>) => (
    <div className="flex gap-2 justify-center">
      {Object.entries(permissionIcons).map(([permKey, IconComponent]) => {
        const isActive = permissions[permKey]
        return (
          <button
            key={permKey}
            onClick={() => togglePermission(userId, module, permKey)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              isActive
                ? "bg-purple-100 border-2 border-purple-600 text-purple-600 shadow-md"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
            title={permKey.charAt(0).toUpperCase() + permKey.slice(1)}
          >
            <IconComponent size={14} />
          </button>
        )
      })}
    </div>
  ), [togglePermission])

  const allModules = Array.from(
    new Set(data.flatMap((user) => Object.keys(user.permissions)))
  )

  const filteredData = data.filter((user) =>
    user.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const moveItem = useCallback((dragIndex: number, hoverIndex: number, parentIndex: number | null) => {
    setMenuItems((prevItems) => {
      if (!prevItems || !Array.isArray(prevItems)) {
        console.warn("moveItem: prevItems is not an array", prevItems)
        return prevItems
      }

      const newItems = [...prevItems]
      if (parentIndex === null) {
        if (dragIndex < 0 || dragIndex >= newItems.length || hoverIndex < 0 || hoverIndex >= newItems.length) {
          console.warn("moveItem: Invalid dragIndex or hoverIndex for top-level item", { dragIndex, hoverIndex, length: newItems.length })
          return prevItems
        }
        const [draggedItem] = newItems.splice(dragIndex, 1)
        if (draggedItem) {
          newItems.splice(hoverIndex, 0, draggedItem)
        }
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: (() => {
            const children = [...newItems[parentIndex].children]
            if (dragIndex < 0 || dragIndex >= children.length || hoverIndex < 0 || hoverIndex >= children.length) {
              console.warn("moveItem: Invalid dragIndex or hoverIndex for nested item", { dragIndex, hoverIndex, length: children.length })
              return children
            }
            const [draggedChild] = children.splice(dragIndex, 1)
            if (draggedChild) {
              children.splice(hoverIndex, 0, draggedChild)
            }
            return children
          })()
        }
      }
      return newItems
    })
  }, [])

  const handleSave = useCallback(() => {
    const selectedMenuItems = menuItems.filter(item => item.isSelected).map(item => ({
      ...item,
      children: item.children.filter(child => child.isSelected)
    }))
    const menuConfig: MenuConfig = {
      role: newRoleName || "Global",
      menu: { items: selectedMenuItems },
      description: "Global menu configuration",
    }
    console.log("🔒 Saved Permissions and Menu (Selected Items Only):", { permissions: data, menu: menuConfig })
    showToast('Changes saved!', 'success')
  }, [menuItems, newRoleName, data, showToast])

  const handleAddUser = useCallback(() => {
    if (newRoleName.trim() === "") {
      showToast("Please enter a role name!", "error")
      return
    }
    const newUser: UserData = {
      id: data.length + 1,
      type: newRoleName,
      permissions: {
        site: { view: false, edit: false, write: false, delete: false },
        dashboard: { view: false, edit: false, write: false, delete: false },
        cars: { view: false, edit: false, write: false, delete: false },
      },
    }
    setData([...data, newUser])
    setNewRoleName("")
    setMenuItems(initialMenu.menu.items)
    setIsDialogOpen(false)
    showToast("New role added!", "success")
  }, [data, newRoleName, showToast])

  const renderMenuItems = useCallback((items: MenuItem[], parentIndex: number | null = null) => {
    if (!items || !Array.isArray(items)) {
      console.warn("renderMenuItems: items is not an array", items)
      return null
    }

    return items.map((item, index) => {
      if (!item) {
        console.warn(`renderMenuItems: item at index ${index} is undefined`, items)
        return null
      }

      return (
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
          {item.children && Array.isArray(item.children) && item.children.length > 0 && (
            <div className="border-l border-gray-200 ml-8 pl-2">
              {renderMenuItems(item.children, parentIndex === null ? index : parentIndex)}
            </div>
          )}
        </React.Fragment>
      )
    })
  }, [moveItem, toggleMenuItem, addChildItem, updateMenuItem, removeMenuItem])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-4 sm:px-6 py-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Search bar and Add User button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
          <div className="relative w-full sm:w-80 gradient-border cursor-glow">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users"
              className="pl-10 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <GradientButton
            text="Add New Role"
            Icon={Plus}
            width="180px"
            onClick={() => setIsDialogOpen(true)}
          />
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm gradient-border cursor-glow">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="border-b border-gray-200 bg-gray-50">
                <TableHead className="w-[50px]">Sr No.</TableHead>
                <TableHead className="w-[150px]">Role Type</TableHead>
                {allModules.map((module) => (
                  <TableHead key={module} className="text-center capitalize">
                    {module} Permissions
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <Badge className="px-3 py-1 text-sm font-medium text-gray-700">
                        {user.type}
                      </Badge>
                    </TableCell>
                    {allModules.map((module) => (
                      <TableCell key={module}>
                        {renderPermissions(user.id, module, user.permissions[module] || {})}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2 + allModules.length} className="text-center py-8 text-gray-400">
                    No roles found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end mt-6">
          <GradientButton
            text="Save All Changes"
            width="200px"
            onClick={handleSave}
          />
        </div>

        {/* Dialog for Add New Role */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl p-6 bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">Add New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
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
                <h3 className="font-semibold text-lg text-gray-800 mb-3">Menu Configuration (Drag to Reorder)</h3>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                  {renderMenuItems(menuItems)}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddUser} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  )
}