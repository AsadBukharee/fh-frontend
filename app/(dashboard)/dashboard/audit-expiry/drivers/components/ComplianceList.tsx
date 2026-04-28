import { useState, useMemo, memo } from "react"
import { Input } from "@/components/ui/input"
import { AuditItem } from "../types"
import { useDriverAttributes, DriverAttribute } from "../hooks/useDriverAttributes"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Pencil, Check, Plus, ChevronsUpDown, X, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComplianceListProps {
    items: AuditItem[]
    setItems: React.Dispatch<React.SetStateAction<AuditItem[]>>
    loading: boolean
    saving: boolean
    onUpdateItem?: (item: AuditItem) => Promise<void>
    onCreateItem?: (item: Omit<AuditItem, "id" | "dbId">) => Promise<void>
    type: "date" | "alert"
    handleExpandedChange?: (id: string) => void
}

// Searchable Select Component for Reference
const ReferenceSelect = ({
    value,
    onChange,
    attributes,
    disabled
}: {
    value: string
    onChange: (value: string) => void
    attributes: DriverAttribute[]
    disabled?: boolean
}) => {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-8 text-xs font-mono bg-white border-green-200"
                    disabled={disabled}
                >
                    {value || "Select attribute..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search attributes..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No attribute found.</CommandEmpty>
                        <CommandGroup>
                            {attributes.map((attr) => (
                                <CommandItem
                                    key={attr.name}
                                    value={attr.name}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue)
                                        setOpen(false)
                                    }}
                                    className="text-xs font-mono"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === attr.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span title={attr.name}>{attr.name} </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// Memoized individual item component
const ComplianceItem = memo(({
    item,
    editingField,
    setEditingField,
    updateField,
    loading,
    saving,
    type,
    attributes,
    attributesLoading,
    handleExpandedChange
}: {
    item: AuditItem,
    editingField: { id: string, field: string } | null,
    setEditingField: (val: { id: string, field: string } | null) => void,
    updateField: (id: string, field: keyof AuditItem, value: any) => void,
    loading: boolean,
    saving: boolean,
    type: "date" | "alert",
    attributes: DriverAttribute[],
    attributesLoading: boolean,
    handleExpandedChange?: (id: string) => void
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            setEditingField(null)
        }
    }

    const isEditingTitle = editingField?.id === item.id && editingField?.field === "title"
    const isEditingSubtitle = editingField?.id === item.id && editingField?.field === "subtitle"
    const isEditingReference = editingField?.id === item.id && editingField?.field === "fieldReference"
    const isEditingFieldName = editingField?.id === item.id && editingField?.field === "fieldName"

    return (
        <TableRow id={item.id} className="hover:bg-transparent border-b border-gray-100 last:border-0">
            <TableCell className="py-3 pl-2">
                <div className="space-y-1">
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
                            onDoubleClick={() => {
                                if (!loading && !saving) {
                                    setEditingField({ id: item.id, field: "title" })
                                    handleExpandedChange?.(item.id)
                                }
                            }}
                            className="group flex items-center space-x-1 font-medium text-gray-900 text-sm cursor-pointer hover:text-pink-600 transition-colors w-full"
                            title="Double click to edit"
                        >
                            <span>{item.title}</span>
                            <Pencil
                                className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-pink-600 ml-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!loading && !saving) {
                                        setEditingField({ id: item.id, field: "title" })
                                        handleExpandedChange?.(item.id)
                                    }
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
                            onDoubleClick={() => {
                                if (!loading && !saving) {
                                    setEditingField({ id: item.id, field: "subtitle" })
                                    handleExpandedChange?.(item.id)
                                }
                            }}
                            className="group flex items-center space-x-1 text-xs text-gray-400 cursor-pointer hover:text-pink-500 transition-colors w-full"
                            title="Double click to edit"
                        >
                            <span className="text-left">{item.subtitle}</span>
                            <Pencil
                                className="w-2.5 h-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-pink-500 ml-2"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (!loading && !saving) {
                                        setEditingField({ id: item.id, field: "subtitle" })
                                        handleExpandedChange?.(item.id)
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </TableCell>
{
                type === "date" ? (
                    <TableCell className="py-3 align-top min-w-[200px]">
                {isEditingFieldName ? (
                    <ReferenceSelect
                        value={item.fieldName || ""}
                        onChange={(val) => {
                            updateField(item.id, "fieldName", val)
                            setEditingField(null)
                        }}
                        attributes={attributes}
                        disabled={loading || saving || attributesLoading}
                    />
                ) : (
                    <div
                        onDoubleClick={() => {
                            if (!loading && !saving) {
                                setEditingField({ id: item.id, field: "fieldName" })
                                handleExpandedChange?.(item.id)
                            }
                        }}
                        className="group flex items-center justify-between space-x-2 bg-gray-50 border border-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-mono cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all w-full"
                        title="Double click to edit"
                    >
                        <span className="truncate">{item.fieldName || "-"}</span>
                        <Pencil
                            className="w-3 h-3 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity inline cursor-pointer hover:text-green-600 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!loading && !saving) {
                                    setEditingField({ id: item.id, field: "fieldName" })
                                    handleExpandedChange?.(item.id)
                                }
                            }}
                        />
                    </div>
                )}
            </TableCell>
                ) : null
}
            <TableCell className="py-3 align-top min-w-[200px]">
                {isEditingReference ? (
                    <ReferenceSelect
                        value={item.fieldReference || ""}
                        onChange={(val) => {
                            updateField(item.id, "fieldReference", val)
                            setEditingField(null)
                        }}
                        attributes={attributes}
                        disabled={loading || saving || attributesLoading}
                    />
                ) : (
                    <div
                        onDoubleClick={() => {
                            if (!loading && !saving) {
                                setEditingField({ id: item.id, field: "fieldReference" })
                                handleExpandedChange?.(item.id)
                            }
                        }}
                        className="group flex items-center justify-between space-x-2 bg-gray-50 border border-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-mono cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all w-full"
                        title="Double click to edit"
                    >
                        <span className="truncate">{item.fieldReference || "-"}</span>
                        <Pencil
                            className="w-3 h-3 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity inline cursor-pointer hover:text-green-600 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!loading && !saving) {
                                    setEditingField({ id: item.id, field: "fieldReference" })
                                    handleExpandedChange?.(item.id)
                                }
                            }}
                        />
                    </div>
                )}
            </TableCell>

            <TableCell className="py-3 align-top">
                <Input
                    type="number"
                    value={item.days}
                    onChange={(e) => updateField(item.id, "days", Number(e.target.value) || 0)}
                    className="w-20 h-9 text-center text-sm border-gray-200 mx-auto"
                    min="-365"
                    disabled={loading || saving}
                />
            </TableCell>

            <TableCell className="py-3 align-top">
                <div className="flex justify-center">
                    <label className="flex items-center cursor-pointer space-x-2 select-none">
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
                        <span className={`text-xs font-medium capitalize transition-colors duration-300 w-12 text-left
                            ${item.status === "before" ? "text-pink-600" : "text-orange-600"}`}>
                            {item.status}
                        </span>
                    </label>
                </div>
            </TableCell>
        </TableRow>
    )
})

ComplianceItem.displayName = "ComplianceItem"

export function ComplianceList({ items, setItems, loading, saving, onUpdateItem, onCreateItem, type, handleExpandedChange }: ComplianceListProps) {
    const [editingField, setEditingField] = useState<{ id: string, field: string } | null>(null)
    const { attributes, loading: attributesLoading } = useDriverAttributes()

    // Create Mode State
    const [isCreating, setIsCreating] = useState(false)
    const [newItem, setNewItem] = useState<{
        title: string
        subtitle: string
        fieldReference: string
        days: number
        status: "before" | "after"
        fieldName: string // Only relevant for dates
    }>({
        title: "",
        subtitle: "",
        fieldReference: "",
        days: 0,
        status: "before",
        fieldName: ""
    })

    // Memoize the attributes list
    const memoizedAttributes = useMemo(() => attributes, [attributes])

    const updateField = (id: string, field: keyof AuditItem, value: any) => {
        setItems(prev => {
            const newItems = prev.map(i => i.id === id ? { ...i, [field]: value } : i)
            handleExpandedChange?.(id)
            if (onUpdateItem) {
                const updatedItem = newItems.find(i => i.id === id)
                if (updatedItem && (field === "fieldReference" || field === "days" || field === "status")) {
                    onUpdateItem(updatedItem)
                }
            }
            return newItems
        })
    }

    const handleCreate = async () => {
        if (!onCreateItem) return;
        if (!newItem.title) return; // Basic validation

        try {
            await onCreateItem({
                title: newItem.title,
                subtitle: newItem.subtitle,
                fieldReference: newItem.fieldReference,
                days: newItem.days,
                status: newItem.status,
                fieldName: newItem.fieldName
            })

            // Reset form
            setNewItem({
                title: "",
                subtitle: "",
                fieldReference: "",
                days: 0,
                status: "before",
                fieldName: ""
            })
            setIsCreating(false)
        } catch (error) {
            console.error("Error creating item", error)
        }
    }

    return (
        <div className="bg-white rounded-md border border-gray-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-b border-gray-100 hover:bg-gray-50/50">
                        <TableHead className="w-[40%] text-xs font-medium text-gray-500 uppercase tracking-wide py-3 pl-4">Audit Item</TableHead>
{type=="date"?
                        <TableHead className="w-[40%] text-xs font-medium text-gray-500 uppercase tracking-wide py-3 pl-4">Field Name</TableHead>
:null}
                        <TableHead className="w-[20%] text-xs font-medium text-gray-500 uppercase tracking-wide py-3">Reference</TableHead>
                        <TableHead className="w-[20%] text-center text-xs font-medium text-gray-500 uppercase tracking-wide py-3">Days</TableHead>
                        <TableHead className="w-[20%] text-center text-xs font-medium text-gray-500 uppercase tracking-wide py-3">Trigger</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <ComplianceItem
                            key={item.id}
                            item={item}
                            editingField={editingField}
                            setEditingField={setEditingField}
                            updateField={updateField}
                            loading={loading}
                            saving={saving}
                            type={type}
                            attributes={memoizedAttributes}
                            attributesLoading={attributesLoading}
                            handleExpandedChange={handleExpandedChange}
                        />
                    ))}

                    {/* Create Row */}
                    {isCreating ? (
                        <TableRow className="bg-blue-50/30 hover:bg-blue-50/30 border-0">
                            <TableCell className="py-4 pl-4">
                                <div className="space-y-3">
                                    <Input
                                        placeholder="Display Name *"
                                        value={newItem.title}
                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                        className="h-9 text-sm border-blue-200 focus:ring-blue-200"
                                        autoFocus
                                    />
                                    {type === "date" && (
                                        <Input
                                            placeholder="Field ID (e.g. driver_cpc_expiry)"
                                            value={newItem.fieldName}
                                            onChange={(e) => setNewItem({ ...newItem, fieldName: e.target.value })}
                                            className="h-8 text-xs font-mono bg-white/50"
                                        />
                                    )}
                                    <Input
                                        placeholder="Description"
                                        value={newItem.subtitle}
                                        onChange={(e) => setNewItem({ ...newItem, subtitle: e.target.value })}
                                        className="h-8 text-xs text-gray-600 bg-white/50"
                                    />
                                </div>
                            </TableCell>
                            
                            <TableCell className="py-4 align-top">
                                <ReferenceSelect
                                    value={newItem.fieldReference}
                                    onChange={(val) => setNewItem({ ...newItem, fieldReference: val })}
                                    attributes={memoizedAttributes}
                                    disabled={attributesLoading}
                                />
                            </TableCell>
                            <TableCell className="py-4 align-top">
                                <Input
                                    type="number"
                                    value={newItem.days}
                                    onChange={(e) => setNewItem({ ...newItem, days: Number(e.target.value) || 0 })}
                                    className="w-20 h-9 text-center text-sm border-gray-200 mx-auto"
                                    placeholder="0"
                                />
                            </TableCell>
                            <TableCell className="py-4 align-top">
                                <div className="flex flex-col items-center gap-4">
                                    <label className="flex items-center cursor-pointer space-x-2 select-none">
                                        <input
                                            type="checkbox"
                                            checked={newItem.status === "after"}
                                            onChange={() => setNewItem({ ...newItem, status: newItem.status === "before" ? "after" : "before" })}
                                            className="hidden"
                                        />
                                        <div className={`relative w-14 h-7 flex items-center rounded-full transition-colors duration-300 
                                            ${newItem.status === "before" ? "bg-pink-100" : "bg-orange-100"}`}>
                                            <div className={`w-5 h-5 rounded-full absolute shadow-md transition-all duration-300
                                                ${newItem.status === "before" ? "left-1 bg-pink-600" : "right-1 bg-orange-500"}`}></div>
                                        </div>
                                    </label>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            onClick={() => setIsCreating(false)}
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                            onClick={handleCreate}
                                            disabled={!newItem.title}
                                        >
                                            <Save className="w-3.5 h-3.5" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : null
                    // (
                    //     <TableRow className="hover:bg-gray-50/50 border-0 cursor-pointer transition-colors" onClick={() => setIsCreating(true)}>
                    //         <TableCell colSpan={4} className="py-3 text-center text-gray-400 group-hover:text-blue-600">
                    //             <div className="flex items-center justify-center gap-2 text-sm font-medium py-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                    //                 <Plus className="w-4 h-4" />
                    //                 <span>Add New {type === "date" ? "Compliance Date" : "Compliance Alert"}</span>
                    //             </div>
                    //         </TableCell>
                    //     </TableRow>
                    // )
                    }
                </TableBody>
            </Table>
        </div>
    )
}