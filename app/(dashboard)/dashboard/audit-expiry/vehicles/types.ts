export interface AuditItem {
    id: string
    title: string
    subtitle: string
    days: number
    status: "before" | "after"
    fieldName?: string
    fieldReference?: string
    dbId?: number
}
