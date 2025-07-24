import React from "react"
import { ShiftCard } from "./shift-card"
import { generateMockShiftData, users } from "@/lib/data"

interface ShiftTableProps {
  year: number
  month: number // 0-indexed (0 for January, 11 for December)
}

export function ShiftTable({ year, month }: ShiftTableProps) {
  const shiftData = generateMockShiftData(year, month)

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long" })
  }

  // Group data by week
  const weeks: { date: Date; shifts: { [userName: string]: any } }[][] = []
  let currentWeek: { date: Date; shifts: { [userName: string]: any } }[] = []

  shiftData.forEach((dayData, index) => {
    const dayOfWeek = dayData.date.getDay() // 0 for Sunday, 6 for Saturday

    // If it's the first day of the month or a Monday (start of a new week)
    if (index === 0 || dayOfWeek === 1) {
      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }
      currentWeek = []
    }
    currentWeek.push(dayData)

    // If it's the last day of the month or a Sunday (end of a week)
    if (index === shiftData.length - 1 || dayOfWeek === 0) {
      if (currentWeek.length > 0) {
        weeks.push(currentWeek)
      }
      currentWeek = [] // Reset for next week, though not strictly needed after last day
    }
  })

  // Handle the last week if it wasn't pushed (e.g., month ends on Saturday)
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full table-auto border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 z-10 border-b border-r px-4 py-3 text-left text-xs font-medium uppercase tracking-wider bg-gray-50">
              Day
            </th>
            {users.map((user) => (
              <th
                key={user}
                className="border-b border-r px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
              >
                {user}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((dayData, dayIndex) => (
                <tr key={dayData.date.toISOString()} className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r px-4 py-2 text-sm font-medium bg-inherit">
                    {getDayName(dayData.date)} {dayData.date.getDate()}
                  </td>
                  {users.map((user) => (
                    <td key={user} className="border-r p-2 align-top">
                      {dayData.shifts[user] ? (
                        <ShiftCard
                          shiftType={dayData.shifts[user]!.type}
                          code={dayData.shifts[user]!.code}
                          hoursInfo={dayData.shifts[user]!.hoursInfo}
                          color={dayData.shifts[user]!.color}
                        />
                      ) : (
                        <div className="h-16 w-full rounded-md bg-gray-100/50" /> // Placeholder for no shift
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Add a separator row between weeks if it's not the last week */}
              {weekIndex < weeks.length - 1 && (
                <tr className="h-2 bg-gray-200">
                  <td colSpan={users.length + 1}></td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
