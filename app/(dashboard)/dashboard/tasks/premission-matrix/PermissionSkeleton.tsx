import { Skeleton } from "@/components/ui/skeleton";

export const PermissionSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div className="max-w-7xl mx-auto">
      <Skeleton className="h-12 w-96 mb-2" />
      <Skeleton className="h-6 w-64 mb-8" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  </div>
);