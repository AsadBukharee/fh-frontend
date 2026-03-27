import * as React from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { type Site } from "./types"

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  error,
}: {
  options: Site[]
  selected: number[]
  onChange: (value: number[]) => void
  placeholder: string
  error?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedSites = options.filter((o) => selected.includes(o.id))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full min-h-12 h-auto justify-between text-left font-normal py-2 px-3 rounded-xl transition-all duration-150",
              error
                ? "border-destructive focus-visible:ring-destructive"
                : selected.length > 0
                ? "border-emerald-400 focus-visible:ring-emerald-500/30"
                : ""
            )}
          >
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {selectedSites.length > 0 ? (
                selectedSites.map((site) => (
                  <Badge
                    key={site.id}
                    variant="secondary"
                    className="text-xs font-medium px-2 py-0.5 flex items-center gap-1"
                  >
                    <MapPin className="h-2.5 w-2.5" />
                    {site.name}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 shadow-lg rounded-xl border" align="start">
          <Command>
            <CommandInput
              placeholder="Search sites..."
              value={search}
              onValueChange={setSearch}
              className="h-10 text-sm"
            />
            <CommandList className="max-h-60">
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No sites found
              </CommandEmpty>
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option.id)
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      const newSelected = isSelected
                        ? selected.filter((id) => id !== option.id)
                        : [...selected, option.id]
                      onChange(newSelected)
                    }}
                    className={cn(
                      "cursor-pointer transition-colors gap-2 py-2.5",
                      isSelected && "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                    )}
                  >
                    <div className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      isSelected
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-muted-foreground/40"
                    )}>
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm">{option.name}</span>
                  </CommandItem>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
