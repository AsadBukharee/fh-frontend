"use client"

import * as React from "react"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"

export interface MultiSelectOption {
    label: string
    value: string | number
}

interface MultiSelectProps {
    options: MultiSelectOption[]
    selected: (string | number)[]
    onChange: (selected: any[]) => void
    placeholder?: string
    className?: string
    error?: boolean
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
    error,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (value: string | number) => {
        onChange(selected.filter((s) => s !== value))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-auto min-h-10 hover:bg-background",
                        error && "border-red-500",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center">
                        {selected.length > 0 ? (
                            options
                                .filter((option) => selected.includes(option.value))
                                .map((option) => (
                                    <Badge
                                        key={option.value}
                                        variant="secondary"
                                        className="mr-1 mb-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleUnselect(option.value)
                                        }}
                                    >
                                        {option.label}
                                        <X className="ml-1 h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command className="w-full">
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        const isSelected = selected.includes(option.value)
                                        if (isSelected) {
                                            onChange(selected.filter((s) => s !== option.value))
                                        } else {
                                            onChange([...selected, option.value])
                                        }
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
