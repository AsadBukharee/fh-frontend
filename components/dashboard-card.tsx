"use client"

import type React from "react"
import { useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface DashboardCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  description?: string
  progress?: number
  progressColor?: string
}

export function DashboardCard({
  title,
  value,
  change,
  icon,
  description,
  progress = 70,
  progressColor = "bg-orange-500",
}: DashboardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cardRef.current.style.setProperty("--mouse-x", `${x}%`)
      cardRef.current.style.setProperty("--mouse-y", `${y}%`)
    }
  }

  return (
    <Card
      ref={cardRef}
      className="transition-all duration-300  gradient-border cursor-glow rounded-md"
      onMouseMove={handleMouseMove}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs mb-2 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}+
            {Math.abs(change)}%
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${progress}%` }}></div>
        </div>
        {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
      </CardContent>
    </Card>
  )
}
