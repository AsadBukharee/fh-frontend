"use client"

import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface DefectsInputProps {
  value: string
  onChange: (newValue: string) => void
  label?: string
  required?: boolean
}

export default function DefectsInput({
  value,
  onChange,
  label = "Enter Defects",
  required = false,
}: DefectsInputProps) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems.join(", "))
  }

  return (
    <div className="space-y-4">
      {/* Input Field */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onChange(items.join(", "))} // auto-trim on blur
          placeholder="Example: Front left tire wear, Brake pad worn, Oil leak"
          className="min-h-[100px] resize-none rounded-xl"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Separate multiple defects with commas.
        </p>
      </div>

      {/* Badges Preview */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-2 text-sm px-3 py-1 rounded-full shadow-sm hover:bg-muted"
            >
              {item}
              <X
                size={14}
                className="cursor-pointer hover:text-red-500"
                onClick={() => removeItem(index)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
