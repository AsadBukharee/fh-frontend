import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Notification } from "@/app/lib/types"

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return "w-2 h-2 bg-blue-500 rounded-full"
      case "alert":
        return "w-2 h-2 bg-yellow-500 rounded-full"
      case "warning":
        return "w-2 h-2 bg-orange-500 rounded-full"
      case "sos":
        return "w-2 h-2 bg-red-500 rounded-full"
      default:
        return "w-2 h-2 bg-gray-500 rounded-full"
    }
  }

  return (
    <DropdownMenuItem className="p-4 border-b">
      <div className="flex items-start space-x-3">
        <div className={`${getNotificationIcon(notification.type)} mt-2`}></div>
        <div>
          <p className="font-medium">{notification.title}</p>
          <p className="text-sm text-gray-500">{notification.message}</p>
          <p className="text-xs text-gray-400">{notification.time}</p>
        </div>
      </div>
    </DropdownMenuItem>
  )
}