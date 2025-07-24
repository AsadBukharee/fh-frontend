interface Shift {
    type: string
    code: number
    hoursInfo: string
    color: "purple" | "green" | "orange" | "red" | "cyan"
  }
  
  interface UserShiftData {
    [userName: string]: Shift | null
  }
  
  interface DailyShiftData {
    date: Date
    shifts: UserShiftData
  }
  
  const users = ["fazlay", "Nabeel", "SAKAT", "FC"]
  const shiftTypes = [
    { type: "Night", color: "purple", codes: [68, 69], hours: ["8.5 / 09", "9 / 09"] },
    { type: "Early", color: "green", codes: [72, 73], hours: ["09 / 09", "09 / 08.5"] },
    { type: "Middle", color: "orange", codes: [82, 83], hours: ["10.5 / 09", "10 / 09"] },
    { type: "Supervisor D", color: "red", codes: [70, 71], hours: ["9 / 09", "9.5 / 09"] },
    { type: "Manager", color: "red", codes: [10, 11], hours: ["10 / 09", "10.5 / 09"] },
    { type: "Day", color: "cyan", codes: [15, 16], hours: ["9 / 09", "9.5 / 09"] },
  ]
  
  function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
  
  export function generateMockShiftData(year: number, month: number): DailyShiftData[] {
    const data: DailyShiftData[] = []
    const daysInMonth = new Date(year, month + 1, 0).getDate()
  
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dailyShifts: UserShiftData = {}
  
      users.forEach((user) => {
        // Randomly assign a shift or null (for no shift)
        if (Math.random() > 0.1) {
          // 90% chance of having a shift
          const randomShiftType = getRandomElement(shiftTypes)
          dailyShifts[user] = {
            type: randomShiftType.type,
            code: getRandomElement(randomShiftType.codes),
            hoursInfo: getRandomElement(randomShiftType.hours),
            color: randomShiftType.color as "purple" | "green" | "orange" | "red" | "cyan",
          }
        } else {
          dailyShifts[user] = null // No shift for this user on this day
        }
      })
      data.push({ date, shifts: dailyShifts })
    }
    return data
  }
  
  export { users, shiftTypes } // Export users for use in ShiftTable
  