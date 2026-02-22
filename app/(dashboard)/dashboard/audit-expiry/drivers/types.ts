// types.ts
export interface AuditItem {
    id: string
    dbId: number
    title: string
    subtitle: string
    fieldReference: string
    days: number
    status: "before" | "after"
    fieldName?: string
}

export interface ApiAlertItem {
    id: number
    display_name: string
    field_description: string
    field_reference: string
    field_value: number
    created_at: string
    updated_at: string
}

// Keeping these for backward compatibility if needed, but AuditItem should be preferred
export interface ComplianceDateItem extends AuditItem {
    fieldName: string
}

export interface ApiDateItem {
    id: number
    display_name: string
    field_name: string
    field_description: string
    field_reference: string
    field_value: number
    created_at: string
    updated_at: string
}