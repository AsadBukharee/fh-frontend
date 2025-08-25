import { Notification, User } from "./types"

export const users: User[] = [
  { id: 1, name: "Jenny Wilson", role: "Driver", avatar: "JW" },
  { id: 2, name: "David Smith", role: "Manager", avatar: "DS" },
  { id: 3, name: "Sarah Johnson", role: "Supervisor", avatar: "SJ" },
  { id: 4, name: "Mike Brown", role: "Admin", avatar: "MB" },
]

// export const notifications: Notification[] = [
//   {
//     id: 1,
//     type: "request",
//     title: "New user registered",
//     message: "Jenny Wilson just signed up",
//     time: "2 minutes ago",
//   },
//   {
//     id: 2,
//     type: "alert",
//     title: "Vehicle inspection due",
//     message: "Honda Civic needs inspection",
//     time: "1 hour ago",
//   },
//   {
//     id: 3,
//     type: "warning",
//     title: "Low fuel alert",
//     message: "Vehicle ABC123 has low fuel",
//     time: "2 hours ago",
//   },
//   {
//     id: 4,
//     type: "sos",
//     title: "Emergency alert",
//     message: "Driver needs assistance",
//     time: "3 hours ago",
//   },
//   {
//     id: 5,
//     type: "request",
//     title: "Task completed",
//     message: "Daily duty log submitted",
//     time: "4 hours ago",
//   },
// ]