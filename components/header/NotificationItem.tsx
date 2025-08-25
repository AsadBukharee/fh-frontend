import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Notification } from "@/app/lib/types";
import { formatDistanceToNow, parseISO } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "system":
        return "w-2 h-2 bg-gray-500 rounded-full";
      default:
        return "w-2 h-2 bg-gray-500 rounded-full";
    }
  };

  const formattedTime = formatDistanceToNow(parseISO(notification.created_at), {
    addSuffix: true,
  });

  return (
    <DropdownMenuItem className="p-4 border-b">
      <div className="flex items-start space-x-3">
        <div className={`${getNotificationIcon(notification.type)} mt-2`}></div>
        <div>
          <p className="font-medium">{notification.title}</p>
          <p className="text-sm text-gray-500">{notification.body}</p>
          <p className="text-xs text-gray-400">{formattedTime}</p>
        </div>
      </div>
    </DropdownMenuItem>
  );
}