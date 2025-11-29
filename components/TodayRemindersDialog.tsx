"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Bell, Clock, Calendar, CheckCircle2, ListTodo, ChevronDown, ChevronUp } from "lucide-react"
import { useCookies } from "next-client-cookies"
import API_URL from "@/app/utils/ENV"
import CreateTaskDialog from "./task/CreateTaskDialog"

// Helper: Format time like "3:15 PM"
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Fix invalid dates from API
const parseISO = (iso: string) => new Date(iso)
const fixDate = (iso: string) => {
  const d = parseISO(iso)
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return new Date()
  return d
}

// Format Date → datetime-local string (e.g. 2025-11-17T16:15)
const formatForDatetimeLocal = (date: Date) => {
  return date.toISOString().slice(0, 16)
}

export default function TodayRemindersDialog() {
  const cookies = useCookies()
  const token = cookies.get("access_token")

  const [open, setOpen] = useState(false)
  const [postponeTime, setPostponeTime] = useState<{ [key: number]: string }>({})
  const [expandedPostpone, setExpandedPostpone] = useState<{ [key: number]: boolean }>({})
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [completedIds, setCompletedIds] = useState<number[]>([])

  // Create Task Dialog State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<any>(null)

// Load only TODAY's reminders using date_from and date_to
const loadToday = async () => {
  setLoading(true)
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const dateStr = `${year}-${month}-${day}`

    const url = `${API_URL}/api/reminders/?date_from=${dateStr}&date_to=${dateStr}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to fetch reminders: ${res.status} ${errorText}`)
    }

    const data = await res.json()

    // Now sort by time (since backend might not sort)
    const sortedReminders = data
      .map((item: any) => ({
        ...item,
        date: fixDate(item.next_reminder || item.start_date || item.created_at)
      }))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())

    setReminders(sortedReminders)

    // Auto-open dialog if there are reminders
    if (sortedReminders.length > 0) {
      setOpen(true)
    }
  } catch (err) {
    console.error("Failed to load today's reminders:", err)
    setReminders([])
  } finally {
    setLoading(false)
  }
}

  // Load on mount
  useEffect(() => {
    loadToday()
  }, [])

  const handleComplete = (id: number) => {
    setCompletedIds([...completedIds, id])
    setTimeout(() => {
      setReminders(prev => prev.filter(r => r.id !== id))
      setCompletedIds(prev => prev.filter(cid => cid !== id))
    }, 500)
  }

  const handleSnooze = async (id: number) => {
    try {
      await fetch(`${API_URL}/api/reminders/${id}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "snooze", snooze_minutes: 30 })
      })
      loadToday()
    } catch (err) {
      alert("Failed to snooze reminder")
    }
  }

  const handlePostpone = async (id: number) => {
    const time = postponeTime[id]
    if (!time) return

    try {
      await fetch(`${API_URL}/api/reminders/${id}/perform-action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: "postpone", postpone_time: time })
      })
      loadToday()
      setPostponeTime(prev => ({ ...prev, [id]: "" }))
      setExpandedPostpone(prev => ({ ...prev, [id]: false }))
    } catch (err) {
      alert("Failed to postpone reminder")
    }
  }

  const handleCreateTask = (reminder: any) => {
    setSelectedReminder(reminder)
    setIsCreateTaskOpen(true)
  }

  const handleTaskCreated = () => {
    if (selectedReminder) {
      handleComplete(selectedReminder.id)
    }
    setSelectedReminder(null)
  }

  // Priority styling
  const priorityConfig: Record<string, any> = {
    urgent: { color: "border-l-red-500 bg-red-50/50", badge: "bg-red-100 text-red-700 border-red-200", label: "Urgent" },
    high: { color: "border-l-orange-500 bg-orange-50/50", badge: "bg-orange-100 text-orange-700 border-orange-200", label: "High" },
    medium: { color: "border-l-yellow-500 bg-yellow-50/50", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Medium" },
    low: { color: "border-l-green-500 bg-green-50/50", badge: "bg-green-100 text-green-700 border-green-200", label: "Low" },
  }

  return (
    <>
      {/* Main Reminders Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">Today&apos;s Reminders</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'} today
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadToday}>
                Refresh
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-muted-foreground font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground/70 mt-1">No reminders for today</p>
              </div>
            ) : (
              <div className="space-y-3 py-1">
                {reminders.map((r) => {
                  const config = priorityConfig[r.priority] || priorityConfig.medium
                  const isCompleted = completedIds.includes(r.id)

                  return (
                    <Card
                      key={r.id}
                      className={`border-l-4 ${config.color} transition-all duration-300 ${
                        isCompleted ? 'opacity-40 scale-[0.98]' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-2 truncate">{r.title}</h3>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">{formatTime(r.date)}</span>
                              </div>
                              <Badge variant="outline" className={`${config.badge} text-xs font-medium border`}>
                                {config.label}
                              </Badge>
                            </div>
                          </div>

                          {/* <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50/80 shrink-0"
                            onClick={() => handleComplete(r.id)}
                            disabled={isCompleted}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            Complete
                          </Button> */}
                        </div>

                        {r.description && (
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{r.description}</p>
                        )}

                        <div className="flex items-center gap-2 pt-3 border-t">
                          <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleSnooze(r.id)}>
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            Snooze 30m
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => handleCreateTask(r)}
                          >
                            <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                            Create Task
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-8 ml-auto text-muted-foreground"
                            onClick={() => setExpandedPostpone(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                          >
                            {expandedPostpone[r.id] ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 mr-1" />
                                Less
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3.5 h-3.5 mr-1" />
                                Postpone
                              </>
                            )}
                          </Button>
                        </div>

                        {expandedPostpone[r.id] && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="text-xs font-medium text-muted-foreground mb-2 block">
                              Select new date & time:
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="datetime-local"
                                className="text-sm h-9 flex-1"
                                value={postponeTime[r.id] || ""}
                                onChange={(e) => setPostponeTime(prev => ({ ...prev, [r.id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                onClick={() => handlePostpone(r.id)}
                                disabled={!postponeTime[r.id]}
                                className="h-9 px-4"
                              >
                                Set
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog with Auto-Prefill */}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onClose={() => {
          setIsCreateTaskOpen(false)
          setSelectedReminder(null)
        }}
        onTaskCreated={handleTaskCreated}
        prefill={
          selectedReminder
            ? {
                title: selectedReminder.title || "",
                description: selectedReminder.description || "",
                priority: ["urgent", "high", "medium", "low"].includes(selectedReminder.priority)
                  ? selectedReminder.priority
                  : "medium",
                deadline: formatForDatetimeLocal(selectedReminder.date),
                // Optional enhancements:
                // estimatedHours: "2",
                // requiresApproval: true,
              }
            : undefined
        }
      />
    </>
  )
}