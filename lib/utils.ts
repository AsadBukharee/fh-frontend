import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

// Formats a date-like value into dd/MM/yyyy for consistent UI display
export function formatDmy(dateLike?: string | number | Date | null): string {
  if (dateLike === null || dateLike === undefined || dateLike === "") return "N/A"
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike)
  if (isNaN(date.getTime())) return "N/A"
  return format(date, "dd/MM/yyyy")
}
