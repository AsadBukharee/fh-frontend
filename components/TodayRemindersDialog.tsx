"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Bell, Clock, Calendar, CheckCircle2, ListTodo } from "lucide-react"
import { format, parseISO } from "date-fns"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"
import CreateTaskDialog from "./task/CreateTaskDialog"

// clean invalid/old dates
const fixDate = (iso: string) => {
  const d = parseISO(iso)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return new Date()
  return d
}

export default function TodayRemindersDialog() {
  const cookies = useCookies()
  const token = cookies.get("access_token")

  const [open, setOpen] = useState(false)
  const [postponeTime, setPostponeTime] = useState<{ [key: number]: string }>({})
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState([])
  const [completedIds, setCompletedIds] = useState<number[]>([])
  
  // Task creation state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<any>(null)

  // ---- Fetch all reminders + filter today ----
  const loadToday = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/reminders/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      const todayOnly = data
        .map((item: any) => ({
          ...item,
          date: fixDate(item.next_reminder || item.start_date)
        }))
        .filter((item: any) => {
          const now = new Date()
          return (
            item.date.getFullYear() === now.getFullYear() &&
            item.date.getMonth() === now.getMonth() &&
            item.date.getDate() === now.getDate()
          )
        })
        .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())

      setReminders(todayOnly)

      // AUTO-OPEN logic
      if (todayOnly.length > 0) setOpen(true)

    } catch (_) {
      setReminders([])
    }
    setLoading(false)
  }

  // Load on mount (auto popup happens here)
  useEffect(() => {
    loadToday()
  }, [])

  // Mark as complete (visual feedback)
  const handleComplete = (id: number) => {
    setCompletedIds([...completedIds, id])
    setTimeout(() => {
      setReminders(reminders.filter((r: any) => r.id !== id))
      setCompletedIds(completedIds.filter(cId => cId !== id))
    }, 500)
  }

  // Snooze 30 minutes
  const handleSnooze = async (id: number) => {
    await fetch(`${API_URL}/api/reminders/${id}/perform-action/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: "snooze", snooze_minutes: 30 })
    })
    loadToday()
  }

  // Postpone to custom time
  const handlePostpone = async (id: number) => {
    const time = postponeTime[id]
    if (!time) return
    
    await fetch(`${API_URL}/api/reminders/${id}/perform-action/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: "postpone",
        postpone_time: time
      })
    })
    loadToday()
    setPostponeTime({ ...postponeTime, [id]: "" })
  }

  // Open create task dialog
  const handleCreateTask = (reminder: any) => {
    setSelectedReminder(reminder)
    setIsCreateTaskOpen(true)
  }

  const handleTaskCreated = () => {
    // Optionally mark reminder as complete after creating task
    if (selectedReminder) {
      handleComplete(selectedReminder.id)
    }
    setSelectedReminder(null)
  }

  const color = {
    urgent: "bg-red-600 text-white hover:bg-red-700",
    high: "bg-orange-500 text-white hover:bg-orange-600",
    medium: "bg-yellow-500 text-black hover:bg-yellow-600",
    low: "bg-green-500 text-white hover:bg-green-600"
  }

  const priorityIcon = {
    urgent: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Today&apos;s Reminders</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'} for today
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">All caught up! No reminders for today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((r: any) => (
                  <Card 
                    key={r.id} 
                    className={`border transition-all duration-500 ${
                      completedIds.includes(r.id) 
                        ? 'opacity-50 scale-95 bg-green-50' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{priorityIcon[r.priority as keyof typeof priorityIcon]}</span>
                            <h3 className="font-semibold text-lg">{r.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(r.date, "hh:mm a")}
                            </span>
                            <Badge className={color[r.priority as keyof typeof color] + " text-xs"}>
                              {r.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleComplete(r.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Done
                        </Button>
                      </div>

                      {/* Description if available */}
                      {r.description && (
                        <p className="text-sm text-gray-600 mb-3 pl-7">{r.description}</p>
                      )}

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleSnooze(r.id)}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Snooze 30m
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                          onClick={() => handleCreateTask(r)}
                        >
                          <ListTodo className="w-3 h-3 mr-1" />
                          Create Task
                        </Button>
                      </div>

                      {/* Postpone Section */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <label className="text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Postpone to:
                        </label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="datetime-local"
                            className="text-xs flex-1"
                            value={postponeTime[r.id] || ""}
                            onChange={(e) => setPostponeTime({ ...postponeTime, [r.id]: e.target.value })}
                          />
                          <Button 
                            size="sm" 
                            onClick={() => handlePostpone(r.id)}
                            disabled={!postponeTime[r.id]}
                            className="text-xs"
                          >
                            Set
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={loadToday}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false)
          setSelectedReminder(null)
        }}
        onTaskCreated={handleTaskCreated}
      />
    </>
  )
}