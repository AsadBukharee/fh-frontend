import * as React from "react"
import { cn } from "@/lib/utils"

/* -------------------------------- Table -------------------------------- */

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full">
    <table
      ref={ref}
      className={cn(
        "w-full border-collapse text-sm text-center border border-gray-300",
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

/* ------------------------------ TableHeader ----------------------------- */

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-white border-b border-gray-300",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

/* ------------------------------- TableBody ------------------------------ */

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

/* ------------------------------- TableRow ------------------------------- */

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-gray-300 transition-colors",
      "odd:bg-[#FFF4F4] even:bg-white",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

/* ------------------------------- TableHead ------------------------------ */

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-center align-middle font-medium",
      "border border-gray-300 bg-white",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

/* ------------------------------- TableCell ------------------------------ */

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle text-center border border-gray-300",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

/* ------------------------------ TableCaption ---------------------------- */

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-muted-foreground text-center",
      className
    )}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

/* -------------------------------- Exports ------------------------------- */

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
}
