// lib/types.ts
export interface Notification {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string | null;
    avatar: string | null;
  };
  title: string;
  body: string;
  type: string;
  data: {
    [key: string]: any; // Flexible for varying data fields
  };
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    results: Notification[];
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
      page_size: number;
    };
    stats: {
      total_count: number;
      unread_count: number;
      read_count: number;
      system_count: number;
      announcement_count: number;
      event_count: number;
    };
  };
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