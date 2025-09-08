"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface DefectsInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

export default function DefectsInput({
  label,
  value,
  onChange,
  required = false,
  placeholder = "Enter defect and press Enter or click Add",
}: DefectsInputProps) {
  const [inputValue, setInputValue] = useState("")

  // Parse defects from comma-separated string
  const defects = value
    ? value
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d)
    : []

  const addDefect = () => {
    if (inputValue.trim()) {
      const newDefects = [...defects, inputValue.trim()]
      console.log("Adding defect:", inputValue.trim(), "New defects:", newDefects)
      // Changed from ", " to "," to avoid spacing issues
      onChange(newDefects.join(","))
      setInputValue("")
    }
  }

  const removeDefect = (index: number) => {
    const newDefects = defects.filter((_, i) => i !== index)
    console.log("Removing defect at index:", index, "New defects:", newDefects)
    // Changed from ", " to "," to avoid spacing issues
    onChange(newDefects.join(","))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addDefect()
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" onClick={addDefect} disabled={!inputValue.trim()} size="sm" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {defects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {defects.map((defect, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              <span className="text-sm">{defect}</span>
              <button
                type="button"
                onClick={() => removeDefect(index)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {defects.length === 0 && required && (
        <p className="text-xs text-destructive">Add at least one defect to continue</p>
      )}
    </div>
  )
}