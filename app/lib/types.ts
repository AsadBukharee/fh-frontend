// @/app/lib/types.ts
export interface Notification {
  id: number;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    avatar: string | null;
  };
  roles: string[];
  title: string;
  body: string;
  type: string;
  category: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_by: string | null;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    categories: {
      drivers: Notification[];
      vehicles: Notification[];
      walkarounds: Notification[];
      rotas: Notification[];
      duty_logs: Notification[];
      mechanic: Notification[];
      other: Notification[];
    };
    counts: {
      drivers: number;
      vehicles: number;
      walkarounds: number;
      rotas: number;
      duty_logs: number;
      mechanic: number;
      other: number;
    };
    pagination: {
      count: number;
      next: string | null;
      previous: string | null;
      current_page: number;
      total_pages: number;
      page_size: number;
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