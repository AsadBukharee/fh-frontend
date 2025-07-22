export interface Notification {
    id: number
    type: string
    title: string
    message: string
    time: string
  }
  
  export interface User {
    id: number
    name: string
    role: string
    avatar: string
  }
  export interface BreadcrumbItem {
    label: string
    path: string
  }