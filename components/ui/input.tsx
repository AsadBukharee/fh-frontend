import * as React from "react"
import { CircleX } from "lucide-react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, onChange, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(value || "")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      onChange?.(e)
    }

    const handleClear = () => {
      setInputValue("")
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
      if (ref && "current" in ref && ref.current) {
        ref.current.focus()
      }
    }

    return (
      <div
        className="relative w-full gradient-border cursor-glow"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          e.currentTarget.style.setProperty("--mouse-x", `${x}%`)
          e.currentTarget.style.setProperty("--mouse-y", `${y}%`)
        }}
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full min-w-[120px] shadow-xl rounded-md border-0 bg-transparent pl-2 pr-8 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          {...props}
        />

        {inputValue && (
          <button
            type="button"
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            onClick={handleClear}
            aria-label="Clear input"
          >
            <CircleX className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
