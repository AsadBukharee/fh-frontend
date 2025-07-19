'use client';
import { useState, useCallback, useEffect, memo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  ListIcon as ListNumbers,
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
  type LucideIcon,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { useToast } from '@/app/Context/ToastContext';
import GradientButton from '@/app/utils/GradientButton';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import React from 'react';
import API_URL from '@/app/utils/ENV';
import { useCookies } from 'next-client-cookies';
import AnimatedLogo from '@/components/LogoLoading';

// Define types
type Permission = {
  view: boolean;
  edit: boolean;
  write: boolean;
  delete: boolean;
};
type UserPermissions = {
  [key: string]: Permission;
};
type UserData = {
  id: number;
  type: string;
  permissions: UserPermissions;
  menu?: { items: MenuItem[] };
};
type MenuItem = {
  nav: string;
  icon: string;
  name: string;
  tooltip: string;
  children: MenuItem[];
  isSelected: boolean;
};
type ApiRole = {
  id: number;
  slug: string;
  name: string;
  menu: { items: MenuItem[] } | Record<string, never>;
};

// Initial menu configuration (used as fallback)
const initialMenu = {
  role: 'Global',
  menu: {
    items: [
      {
        nav: '/users',
        icon: 'UserPlus',
        name: 'User Management',
        tooltip: 'Manage users and permissions',
        children: [],
        isSelected: true,
      },
      {
        nav: '/sites',
        icon: 'Building2',
        name: 'Sites',
        tooltip: 'Manage operational sites',
        children: [],
        isSelected: true,
      },
      {
        nav: '/vehicles',
        icon: 'Truck',
        name: 'Vehicles',
        tooltip: 'Vehicle dashboard and tools',
        children: [
          {
            nav: '/vehicles/walkaround',
            icon: 'ClipboardCheck',
            name: 'Walkaround',
            tooltip: 'Walkaround inspection checks',
            children: [],
            isSelected: true,
          },
          {
            nav: '/vehicles/fuel-checks',
            icon: 'Fuel',
            name: 'Fuel Checks',
            tooltip: 'Vehicle fuel checks and logs',
            children: [],
            isSelected: true,
          },
          {
            nav: '/vehicles/tyre-checks',
            icon: 'LifeBuoy',
            name: 'Tyre Checks',
            tooltip: 'Tyre condition and tread inspections',
            children: [],
            isSelected: true,
          },
          {
            nav: '/vehicles/equipment-checks',
            icon: 'Stethoscope',
            name: 'Equipment Checks',
            tooltip: 'Onboard equipment inspections',
            children: [],
            isSelected: true,
          },
          {
            nav: '/vehicles/valet-checks',
            icon: 'Car',
            name: 'Valet Checks',
            tooltip: 'Vehicle cleanliness & valet review',
            children: [
              {
                nav: '/vehicles/valet-checks/gatekeeper',
                icon: 'ShieldCheck',
                name: 'Gate Keeper Checks',
                tooltip: 'Final checks at site gate',
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
        nav: '/staff',
        icon: 'BookUser',
        name: 'Staff',
        tooltip: 'Staff records and schedules',
        children: [
          {
            nav: '/staff/duty-logs',
            icon: 'CalendarCheck',
            name: 'Daily Duty Logs',
            tooltip: 'Daily staff duty logs',
            children: [],
            isSelected: true,
          },
          {
            nav: '/staff/wtd-logs',
            icon: 'Clock',
            name: 'WTD Logs',
            tooltip: 'Working Time Directive logs',
            children: [],
            isSelected: true,
          },
          {
            nav: '/staff/clocking',
            icon: 'LogIn',
            name: 'Clocking Logs',
            tooltip: 'Clock-in / Clock-out entries',
            children: [],
            isSelected: true,
          },
          {
            nav: '/staff/rotas',
            icon: 'RefreshCw',
            name: 'Rotas',
            tooltip: 'Weekly rota planning',
            children: [],
            isSelected: true,
          },
          {
            nav: '/staff/contracts',
            icon: 'FileText',
            name: 'Contracts',
            tooltip: 'Staff contract records',
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: '/inspections',
        icon: 'ClipboardList',
        name: 'MOTs & Insp.',
        tooltip: 'MOTs & Inspections',
        children: [
          {
            nav: '/inspections/maintenance-pmi',
            icon: 'Activity',
            name: 'Maintenance PMI',
            tooltip: 'Maintenance PMI Analysis',
            children: [],
            isSelected: true,
          },
          {
            nav: '/inspections/driver-pmi',
            icon: 'UserCheck',
            name: 'Driver PMI',
            tooltip: 'Driver PMI Analysis',
            children: [],
            isSelected: true,
          },
          {
            nav: '/inspections/service-history',
            icon: 'Book',
            name: 'Service History',
            tooltip: 'Service and inspection history',
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: '/mechanic-jobs',
        icon: 'Wrench',
        name: 'Mechanic',
        tooltip: 'Mechanic Jobs',
        children: [],
        isSelected: true,
      },
      {
        nav: '/su-transport',
        icon: 'Database',
        name: 'SU Transport Data',
        tooltip: 'Special unit transport logs',
        children: [
          {
            nav: '/su-transport/numbers',
            icon: 'ListNumbers',
            name: 'SU Numbers Screen',
            tooltip: 'Show SU Numbers',
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: '/audit-expiry',
        icon: 'CalendarX',
        name: 'Audit Expiry',
        tooltip: 'Audit Expiry Dates',
        children: [
          {
            nav: '/audit-expiry/vehicles',
            icon: 'Truck',
            name: 'Vehicles',
            tooltip: 'Audit Expiry Dates for Vehicles',
            children: [],
            isSelected: true,
          },
          {
            nav: '/audit-expiry/drivers',
            icon: 'User',
            name: 'Drivers',
            tooltip: 'Audit Expiry Dates for Drivers',
            children: [],
            isSelected: true,
          },
          {
            nav: '/audit-expiry/others',
            icon: 'MoreHorizontal',
            name: 'Others',
            tooltip: 'Audit Expiry Dates for Others',
            children: [],
            isSelected: true,
          },
        ],
        isSelected: true,
      },
      {
        nav: '/knowledge',
        icon: 'BookOpen',
        name: 'Knowledge',
        tooltip: 'Knowledge Library',
        children: [],
        isSelected: true,
      },
      {
        nav: '/documents',
        icon: 'File',
        name: 'Documents',
        tooltip: 'Document Lists',
        children: [],
        isSelected: true,
      },
      {
        nav: '/tasks',
        icon: 'SquareCheckBig',
        name: 'Outstanding Tasks',
        tooltip: 'Outstanding Tasks',
        children: [],
        isSelected: true,
      },
      {
        nav: '/reminders',
        icon: 'CalendarClock',
        name: 'Reminders',
        tooltip: 'Reminders',
        children: [],
        isSelected: true,
      },
      {
        nav: '/notifications',
        icon: 'Bell',
        name: 'Notifications',
        tooltip: 'All notifications',
        children: [],
        isSelected: true,
      },
    ],
  },
  description: 'Global menu configuration',
};

// Icons for permissions
const permissionIcons = {
  view: Eye,
  edit: Edit,
  delete: Trash2,
};

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
  BarChart3,
  TowerControl,
  Headset,
};

// Available icons for selection
const availableIcons = Object.keys(LucideIconMap);

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
    item: MenuItem;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number, parentIndex: number | null) => void;
    parentIndex?: number | null;
    toggleMenuItem: (index: number, parentIndex: number | null) => void;
    addChildItem: (parentIndex: number | null, index: number) => void;
    updateMenuItem: (
      index: number,
      parentIndex: number | null,
      updates: Partial<MenuItem>,
    ) => void;
    removeMenuItem: (index: number, parentIndex: number | null) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [wasRightClicked, setWasRightClicked] = useState(false); // Track right-click
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      console.log('MenuItemComponent rendered:', item.name, 'Icon:', item.icon);
    }, [item]);

    const [, drop] = useDrop({
      accept: 'MENU_ITEM',
      hover: (draggedItem: { index: number; parentIndex: number | null }) => {
        if (
          draggedItem.index === index &&
          draggedItem.parentIndex === parentIndex
        ) {
          return;
        }
        moveItem(draggedItem.index, index, parentIndex);
        draggedItem.index = index;
        draggedItem.parentIndex = parentIndex;
      },
    });

    const [{ isDragging }, drag] = useDrag({
      type: 'MENU_ITEM',
      item: { index, parentIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const IconComponent = LucideIconMap[item.icon] || File;

    const handleDoubleClick = () => {
      setIsEditing(true);
    };

    const handleBlur = (event: React.FocusEvent) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (containerRef.current && relatedTarget && containerRef.current.contains(relatedTarget)) {
        return;
      }
      setIsEditing(false);
      setWasRightClicked(false); // Reset right-click state
    };

    const handleIconChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      console.log('Selected icon:', value, 'Is valid:', !!LucideIconMap[value]);
      updateMenuItem(index, parentIndex, {
        icon: LucideIconMap[value] ? value : 'File',
      });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        setIsEditing(false);
        setWasRightClicked(false); // Reset right-click state
      }
      // Prevent spacebar from affecting select if right-clicked
      if (event.key === ' ' && wasRightClicked) {
        event.preventDefault();
      }
    };

    // Handle right-click to prevent focusing the select element
    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault(); // Prevent default context menu
      setWasRightClicked(true); // Mark right-click state
      // Blur the active element to prevent focus
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };

    const ref = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      drag(drop(node));
    };

    return (
      <div
        ref={ref}
        className={`relative flex items-center w-[500px] h-[50px] gap-2 p-2 my-1 rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-200 ${
          isDragging
            ? 'opacity-50 border-blue-400 shadow-lg'
            : 'hover:border-blue-300 hover:shadow-md'
        }`}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu} // Prevent right-click issues
      >
        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab shrink-0" />
        <Checkbox
          checked={item.isSelected}
          onCheckedChange={() => toggleMenuItem(index, parentIndex)}
          className="mr-2"
        />
        {isEditing ? (
          <>
            <select
              value={LucideIconMap[item.icon] ? item.icon : 'File'}
              onChange={handleIconChange}
              onContextMenu={handleContextMenu} // Prevent right-click focus
              className="w-[120px] h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableIcons.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
            <Input
              value={item.name}
              onChange={(e) =>
                updateMenuItem(index, parentIndex, {
                  name: e.target.value,
                  tooltip: e.target.value,
                })
              }
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
          </>
        ) : (
          <>
            <IconComponent className="h-4 w-4 text-gray-600 shrink-0" />
            <span className="flex-1 truncate text-sm font-medium">
              {item.name}
            </span>
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
    );
  },
);
MenuItemComponent.displayName = 'MenuItemComponent';

export default function UsersPage() {
  const [data, setData] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenu.menu.items);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
  const { showToast } = useToast();
  const cookies = useCookies();
  const token = cookies.get('access_token');

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/roles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }

        const { results }: { results: ApiRole[] } = await response.json();
        const mappedData: UserData[] = results.map((role) => {
          let menuData: { items: MenuItem[] } | undefined;
          
          if ('items' in role.menu && Array.isArray(role.menu.items)) {
            menuData = { items: role.menu.items as MenuItem[] };
          }
          
          return {
            id: role.id,
            type: role.name,
            permissions: {
              site: { view: false, edit: false, write: false, delete: false },
              dashboard: { view: false, edit: false, write: false, delete: false },
              cars: { view: false, edit: false, write: false, delete: false },
            },
            menu: menuData,
          };
        });
        setData(mappedData);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        showToast(
          error instanceof Error
            ? error.message
            : 'An error occurred while fetching roles',
          'error',
        );
      }
    };

    fetchRoles();
  }, [showToast, token]);

  const togglePermission = useCallback(
    (id: number, module: string, permission: string) => {
      setData((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                permissions: {
                  ...user.permissions,
                  [module]: {
                    ...user.permissions[module],
                    [permission]: !user.permissions[module][
                      permission as keyof Permission
                    ],
                  },
                },
              }
            : user,
        ),
      );
    },
    [],
  );

  const toggleMenuItem = useCallback(
    (index: number, parentIndex: number | null) => {
      setMenuItems((prevItems) => {
        const newItems = [...prevItems];
        if (parentIndex === null) {
          newItems[index] = {
            ...newItems[index],
            isSelected: !newItems[index].isSelected,
            children: newItems[index].children.map((child) => ({
              ...child,
              isSelected: !newItems[index].isSelected,
            })),
          };
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
          };
        }
        return newItems;
      });
    },
    [],
  );

  const addChildItem = useCallback((parentIndex: number | null, index: number) => {
    setMenuItems((prevItems) => {
      const newItems = [...prevItems];
      const newChild: MenuItem = {
        nav: `/new-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        icon: 'File',
        name: 'New Item',
        tooltip: 'New menu item',
        children: [],
        isSelected: true,
      };

      if (parentIndex === null) {
        newItems[index] = {
          ...newItems[index],
          children: [...newItems[index].children, newChild],
        };
      } else {
        newItems[parentIndex] = {
          ...newItems[parentIndex],
          children: newItems[parentIndex].children.map((child, i) =>
            i === index
              ? { ...child, children: [...child.children, newChild] }
              : child,
          ),
        };
      }
      return newItems;
    });
  }, []);

  const updateMenuItem = useCallback(
    (index: number, parentIndex: number | null, updates: Partial<MenuItem>) => {
      if (updates.icon && !LucideIconMap[updates.icon]) {
        showToast(
          `Invalid icon "${updates.icon}" selected. Falling back to default icon.`,
          'info',
        );
        updates = { ...updates, icon: 'File' };
      }
      setMenuItems((prevItems) => {
        const newItems = [...prevItems];
        if (parentIndex === null) {
          newItems[index] = { ...newItems[index], ...updates };
        } else {
          newItems[parentIndex] = {
            ...newItems[parentIndex],
            children: newItems[parentIndex].children.map((child, i) =>
              i === index ? { ...child, ...updates } : child,
            ),
          };
        }
        console.log('Updated menu items:', newItems); // Debug log
        return newItems;
      });
    },
    [showToast],
  );

  const removeMenuItem = useCallback(
    (index: number, parentIndex: number | null) => {
      setMenuItems((prevItems) => {
        const newItems = [...prevItems];
        if (parentIndex === null) {
          newItems.splice(index, 1);
        } else {
          newItems[parentIndex] = {
            ...newItems[parentIndex],
            children: newItems[parentIndex].children.filter((_, i) => i !== index),
          };
        }
        return newItems;
      });
    },
    [],
  );

  const renderPermissions = useCallback(
    (userId: number, module: string, permissions: Record<string, boolean>) => (
      <div className="flex gap-2 justify-center">
        {Object.entries(permissionIcons).map(([permKey, IconComponent]) => {
          const isActive = permissions[permKey];
          return (
            <button
              key={permKey}
              onClick={() => togglePermission(userId, module, permKey)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-purple-100 border-2 border-purple-600 text-purple-600 shadow-md'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
              }`}
              title={permKey.charAt(0).toUpperCase() + permKey.slice(1)}
            >
              <IconComponent size={14} />
            </button>
          );
        })}
      </div>
    ),
    [togglePermission],
  );

  const allModules = Array.from(
    new Set(data.flatMap((user) => Object.keys(user.permissions))),
  );

  const filteredData = data.filter((user) =>
    user.type.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const moveItem = useCallback(
    (dragIndex: number, hoverIndex: number, parentIndex: number | null) => {
      setMenuItems((prevItems) => {
        const newItems = [...prevItems];
        if (parentIndex === null) {
          const [draggedItem] = newItems.splice(dragIndex, 1);
          newItems.splice(hoverIndex, 0, draggedItem);
        } else {
          newItems[parentIndex] = {
            ...newItems[parentIndex],
            children: (() => {
              const children = [...newItems[parentIndex].children];
              const [draggedChild] = children.splice(dragIndex, 1);
              children.splice(hoverIndex, 0, draggedChild);
              return children;
            })(),
          };
        }
        return newItems;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    const selectedMenuItems = menuItems
      .filter((item) => item.isSelected)
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => child.isSelected),
      }));
    console.log('Saving menu items:', selectedMenuItems);
    showToast('Changes saved!', 'success');
  }, [menuItems, showToast]);

  const handleAddUser = useCallback(async () => {
    if (newRoleName.trim() === '') {
      showToast('Please enter a role name!', 'error');
      return;
    }

    const selectedMenuItems = menuItems
      .filter((item) => item.isSelected)
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => child.isSelected),
      }));

    const payload = {
      slug: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      name: newRoleName,
      menu: { items: selectedMenuItems },
    };

    try {
      console.log('Add role payload:', JSON.stringify(payload, null, 2));
      const response = await fetch(`${API_URL}/roles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add role');
      }

      const newRole: ApiRole = await response.json();
      const newUser: UserData = {
        id: newRole.id,
        type: newRole.name,
        permissions: {
          site: { view: false, edit: false, write: false, delete: false },
          dashboard: { view: false, edit: false, write: false, delete: false },
          cars: { view: false, edit: false, write: false, delete: false },
        },
        menu: { items: selectedMenuItems },
      };
      setData((prev) => [...prev, newUser]);
      setNewRoleName('');
      setIsDialogOpen(false);
      setDialogMode('add');
      showToast('New role added successfully!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'An error occurred while adding the role',
        'error',
      );
    }
  }, [newRoleName, menuItems, showToast, token]);

  const handleEditRole = useCallback(
    (role: UserData) => {
      setDialogMode('edit');
      setEditingRoleId(role.id);
      setNewRoleName(role.type);
      setMenuItems(
        role.menu?.items.length ? role.menu.items : initialMenu.menu.items,
      );
      setIsDialogOpen(true);
    },
    [],
  );

  const handleUpdateRole = useCallback(async () => {
    if (newRoleName.trim() === '') {
      showToast('Please enter a role name!', 'error');
      return;
    }

    if (editingRoleId === null) {
      showToast('No role selected for editing!', 'error');
      return;
    }

    const selectedMenuItems = menuItems
      .filter((item) => item.isSelected)
      .map((item) => ({
        ...item,
        children: item.children.filter((child) => child.isSelected),
      }));

    const payload = {
      slug: newRoleName.toLowerCase().replace(/\s+/g, '-'),
      name: newRoleName,
      menu: { items: selectedMenuItems },
    };

    try {
      console.log('Update role payload:', JSON.stringify(payload, null, 2));
      const response = await fetch(`${API_URL}/roles/${editingRoleId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update role');
      }

      const updatedRole: ApiRole = await response.json();
      setData((prev) =>
        prev.map((user) =>
          user.id === editingRoleId
            ? {
                ...user,
                type: updatedRole.name,
                menu: { items: selectedMenuItems },
              }
            : user,
        ),
      );
      setNewRoleName('');
      setIsDialogOpen(false);
      setDialogMode('add');
      setEditingRoleId(null);
      showToast('Role updated successfully!', 'success');
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'An error occurred while updating the role',
        'error',
      );
    }
  }, [editingRoleId, newRoleName, menuItems, showToast, token]);

  const handleDeleteRole = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(`${API_URL}/roles/${id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete role');
        }

        setData((prev) => prev.filter((user) => user.id !== id));
        showToast('Role deleted successfully!', 'success');
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : 'An error occurred while deleting the role',
          'error',
        );
      }
    },
    [showToast, token],
  );

  const handleOpenConfirmDialog = useCallback((id: number) => {
    setRoleToDelete(id);
    setIsConfirmDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (roleToDelete !== null) {
      await handleDeleteRole(roleToDelete);
      setIsConfirmDialogOpen(false);
      setRoleToDelete(null);
    }
  }, [roleToDelete, handleDeleteRole]);

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
      ));
    },
    [moveItem, toggleMenuItem, addChildItem, updateMenuItem, removeMenuItem],
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-4 sm:px-6 py-6 space-y-6 bg-gray-50 min-h-screen">
        {isLoading ? (
          <AnimatedLogo />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-5">
              <div className="relative w-full sm:w-80 gradient-border cursor-glow">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search roles"
                  className="pl-10 bg-white border border-gray-300 text-gray-800 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <GradientButton
                text="Add Role"
                Icon={Plus}
                width="180px"
                onClick={() => {
                  setDialogMode('add');
                  setNewRoleName('');
                  setMenuItems(initialMenu.menu.items);
                  setIsDialogOpen(true);
                }}
              />
            </div>

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
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((user) => (
                      <TableRow
                        key={user.id}
                        className="hover:bg-gray-50 border-1 border-gray-200"
                      >
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
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
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
                      <TableCell
                        colSpan={2 + allModules.length + 1}
                        className="text-center py-8 text-gray-400"
                      >
                        No roles found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end mt-6">
              <GradientButton text="Save Changes" width="200px" onClick={handleSave} />
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setDialogMode('add');
                  setNewRoleName('');
                  setMenuItems(initialMenu.menu.items);
                  setEditingRoleId(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-2xl p-6 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    {dialogMode === 'add' ? 'Add New Role' : 'Edit Role'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div>
                    <label
                      htmlFor="role-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
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
                      Menu Configuration (Drag to Reorder)
                    </h3>
                    <div className="max-h-76 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                      {renderMenuItems(menuItems)}
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setDialogMode('add');
                      setNewRoleName('');
                      setMenuItems(initialMenu.menu.items);
                      setEditingRoleId(null);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={dialogMode === 'add' ? handleAddUser : handleUpdateRole}
                    className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {dialogMode === 'add' ? 'Add Role' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isConfirmDialogOpen}
              onOpenChange={(open) => {
                setIsConfirmDialogOpen(open);
                if (!open) {
                  setRoleToDelete(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-md p-6 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-800">
                    Confirm Deletion
                  </DialogTitle>
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
                      setIsConfirmDialogOpen(false);
                      setRoleToDelete(null);
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
  );
}