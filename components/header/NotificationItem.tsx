// @/components/header/NotificationItem.tsx
import { Notification } from "@/app/lib/types";
import {
  User,
  Truck,
  Footprints,
  Calendar,
  ClipboardList,
  Wrench,
  AlertCircle,
} from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: number) => void;
}

// Map categories to icons and display names
const categoryConfig = {
  drivers: { icon: User, label: "Drivers" },
  vehicles: { icon: Truck, label: "Vehicles" },
  walkarounds: { icon: Footprints, label: "Walkarounds" },
  rotas: { icon: Calendar, label: "Rotas" },
  duty_logs: { icon: ClipboardList, label: "Duty Logs" },
  mechanic: { icon: Wrench, label: "Mechanic" },
  other: { icon: AlertCircle, label: "Other" },
};

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const CategoryIcon = categoryConfig[notification.category as keyof typeof categoryConfig]?.icon || AlertCircle;

  return (
    <div
      className={`p-4 border-b flex items-start gap-3 cursor-pointer transition-colors ${
        notification.is_read ? "bg-gray-50" : "bg-white hover:bg-gray-100"
      }`}
      onClick={() => onMarkAsRead && onMarkAsRead(notification.id)}
    >
      <CategoryIcon className="w-5 h-5 text-gray-600 mt-1" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <span className="text-xs text-gray-500">
            ({categoryConfig[notification.category as keyof typeof categoryConfig]?.label || "Unknown"})
          </span>
        </div>
        <p className="text-sm text-gray-600">{notification.body}</p>
        <p className="text-xs text-gray-400">
          {new Date(notification.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {notification.user && (
          <p className="text-xs text-gray-500 mt-1">
            From: {notification.user.full_name} ({notification.user.role})
          </p>
        )}
      </div>
      {!notification.is_read && (
        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
      )}
    </div>
  );
}