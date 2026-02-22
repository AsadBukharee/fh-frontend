import { AuditItem } from "./types"

/**
 * Convert API value (positive = after, negative = before) to UI representation.
 */
export const toStatusAndDays = (value: number | null | undefined, fallback: number): { days: number; status: "before" | "after" } => {
    let val = value
    if (val === null || val === undefined) val = fallback

    return {
        days: Math.abs(val),
        status: val >= 0 ? "after" : "before"
    }
}

/**
 * Convert UI representation to API value.
 */
export const toApiValue = (item: Pick<AuditItem, "status" | "days">): number => {
    return item.status === "before" ? -item.days : item.days
}
