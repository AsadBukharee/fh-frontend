"use client"

import React from 'react'
import { Settings } from 'lucide-react'

export function Dashboard_Loading() {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="flex flex-col items-center space-y-4">
        {/* Gears Container */}
        <div className="flex items-center justify-center space-x-2">
          {/* Gear 1 - Rotates Clockwise */}
          <Settings className="w-16 h-16 text-white animate-spin" />
          {/* Gear 2 - Rotates Counter-Clockwise */}
          <Settings className="w-12 h-12 text-white animate-[spin_1s_linear_infinite_reverse]" />
        </div>
        {/* Text */}
        <span className="text-white text-lg font-medium">Setting Dashboard</span>
      </div>
    </div>
  )
}