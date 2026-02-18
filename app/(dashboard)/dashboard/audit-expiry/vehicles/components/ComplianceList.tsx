import { useState, useMemo, memo } from "react"
import { Input } from "@/components/ui/input"
import { AuditItem } from "../types"
import { useVehicleAttributes, VehicleAttribute } from "../hooks/useVehicleAttributes"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Pencil } from "lucide-react"

interface ComplianceListProps {
    items: AuditItem[]
    setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>
    loading: boolean
    saving: boolean
    onUpdateItem?: (item: AuditItem) => Promise<void>
}

// Memoized individual item component to prevent unnecessary re-renders
const ComplianceItem = memo(({
    item,
    editingField,
    setEditingField,
    updateField,
    loading,
    saving,
    attributes,
    attributesLoading
}: {
    item: AuditItem,
    editingField: { id: string, field: string } | null,
    setEditingField: (val: { id: string, field: string } | null) => void,
    updateField: (id: string, field: keyof AuditItem, value: any) => void,
    loading: boolean,
    saving: boolean,
    attributes: VehicleAttribute[],
    attributesLoading: boolean
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setEditingField(null)
        }
    }

    const isEditingTitle = editingField?.id === item.id && editingField?.field === "title"
    const isEditingSubtitle = editingField?.id === item.id && editingField?.field === "subtitle"
    const isEditingReference = editingField?.id === item.id && editingField?.field === "fieldReference"

    return (
        <div className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 last:border-b-0 items-center">
            <div className="col-span-6 space-y-2">
                {isEditingTitle ? (
                    <Input
                        autoFocus
                        value={item.title}
                        onChange={(e) => updateField(item.id, "title", e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-sm font-medium border-pink-300 focus:ring-1 focus:ring-pink-300"
                        disabled={loading || saving}
                    />
                ) : (
                    <div
                        onDoubleClick={() => !loading && !saving && setEditingField({ id: item.id, field: "title" })}
                        className="group flex items-center space-x-1 font-medium text-gray-900 text-sm cursor-pointer hover:text-pink-600 transition-colors"
                        title="Click icon or double click text to edit"
                    >
                        <span>{item.title}</span>
                        <Pencil
                            className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-pink-600"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!loading && !saving) setEditingField({ id: item.id, field: "title" })
                            }}
                        />
                    </div>
                )}

                {isEditingSubtitle ? (
                    <Input
                        autoFocus
                        value={item.subtitle}
                        onChange={(e) => updateField(item.id, "subtitle", e.target.value)}
                        onBlur={() => setEditingField(null)}
                        onKeyDown={handleKeyDown}
                        className="h-7 text-xs text-gray-500 border-pink-200 focus:ring-1 focus:ring-pink-200"
                        disabled={loading || saving}
                    />
                ) : (
                    <div
                        onDoubleClick={() => !loading && !saving && setEditingField({ id: item.id, field: "subtitle" })}
                        className="group flex items-center space-x-1 text-xs text-gray-400 mt-1 cursor-pointer hover:text-pink-500 transition-colors"
                        title="Click icon or double click text to edit"
                    >
                        <span>{item.subtitle}</span>
                        <Pencil
                            className="w-2.5 h-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-pink-500"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!loading && !saving) setEditingField({ id: item.id, field: "subtitle" })
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="col-span-2">
                {isEditingReference ? (
                    <Select
                        value={item.fieldReference || ""}
                        onValueChange={(value) => {
                            updateField(item.id, "fieldReference", value)
                            setEditingField(null)
                        }}
                        disabled={loading || saving || attributesLoading}
                        open={true}
                        onOpenChange={(open) => {
                            if (!open) setEditingField(null)
                        }}
                    >
                        <SelectTrigger className="h-8 text-xs font-mono border-blue-200 focus:ring-1 focus:ring-blue-200 bg-gray-50">
                            <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                            {attributes.map((attr) => (
                                <SelectItem key={attr.name} value={attr.name} className="text-xs font-mono">
                                    {attr.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div
                        onDoubleClick={() => !loading && !saving && setEditingField({ id: item.id, field: "fieldReference" })}
                        className="group flex items-center space-x-2 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs inline-block font-mono cursor-pointer hover:bg-gray-200 transition-colors"
                        title="Click icon or double click text to edit"
                    >
                        <span>{item.fieldReference || "-"}</span>
                        <Pencil
                            className="w-3 h-3 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity inline cursor-pointer hover:text-blue-600"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!loading && !saving) setEditingField({ id: item.id, field: "fieldReference" })
                            }}
                        />
                    </div>
                )}
            </div>

            <div className="col-span-2 flex justify-center">
                <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => updateField(item.id, "days", Number(e.target.value) || 0)}
                    className="w-20 h-9 text-center text-sm border-gray-300"
                    min="-365"
                    disabled={loading || saving}
                />
            </div>

            <div className="col-span-2 flex items-center justify-center">
                <label className="flex items-center cursor-pointer space-x-2">
                    <input
                        type="checkbox"
                        checked={item.status === "after"}
                        onChange={() => updateField(item.id, "status", item.status === "before" ? "after" : "before")}
                        className="hidden"
                        disabled={loading || saving}
                    />
                    <div className={`relative w-14 h-7 flex items-center rounded-full transition-colors duration-300 
                        ${item.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}>
                        <div className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                            ${item.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}></div>
                    </div>
                    <span className={`text-xs font-medium capitalize transition-colors duration-300 
                        ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}>
                        {item.status}
                    </span>
                </label>
            </div>
        </div>
    )
})

ComplianceItem.displayName = "ComplianceItem"

export function ComplianceList({ items, setItems, loading, saving, onUpdateItem }: ComplianceListProps) {
    const [editingField, setEditingField] = useState<{ id: string, field: string } | null>(null)
    const { attributes, loading: attributesLoading } = useVehicleAttributes()

    // Memoize the attributes list to avoid unnecessary re-renders of SelectContent items
    const memoizedAttributes = useMemo(() => attributes, [attributes])

    const updateField = (id: string, field: keyof AuditItem, value: any) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, [field]: value } : i)
            if (onUpdateItem && field === "fieldReference") {
                const updatedItem = newItems.find(i => i.id === id)
                if (updatedItem) onUpdateItem(updatedItem)
            }
            return newItems
        })
    }

    return (
        <div className="bg-white px-2">
            {items.map((item) => (
                <ComplianceItem
                    key={item.id}
                    item={item}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    updateField={updateField}
                    loading={loading}
                    saving={saving}
                    attributes={memoizedAttributes}
                    attributesLoading={attributesLoading}
                />
            ))}
        </div>
    )
}
