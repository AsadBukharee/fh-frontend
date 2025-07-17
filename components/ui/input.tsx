
import * as React from "react"
import { cn } from "@/lib/utils"

// Removed InputProps interface

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
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
            "flex h-10 w-full rounded-md border-0 bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
