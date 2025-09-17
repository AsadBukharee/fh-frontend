"use client"

import { FC } from "react"
import { Badge } from "@/components/ui/badge"

interface BadgeListProps {
  value: string
}

const BadgeList: FC<BadgeListProps> = ({ value }) => {
  if (!value) return null

  const items = value.split(",").map((item) => item.trim()).filter(Boolean)

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge key={index} variant="secondary" className="text-sm">
          {item}
        </Badge>
      ))}
    </div>
  )
}

export default BadgeList
