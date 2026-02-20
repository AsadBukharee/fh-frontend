// utils.ts
import { AuditItem } from "./types"

export const toStatusAndDays = (value: number): { days: number; status: "before" | "after" } => {
    return {
        days: Math.abs(value),
        status: value > 0 ? "after" : "before"
    }
}

export const toApiValue = (item: Pick<AuditItem, "days" | "status">): number => {
    return item.status === "after" ? Math.abs(item.days) : -Math.abs(item.days)
}
