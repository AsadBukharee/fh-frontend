"use client"
import { JSX, useEffect, useState } from "react"
import { Messaging, getToken, onMessage } from "firebase/messaging"
import { messaging } from "@/app/FCM/firebase"
import { toast } from "sonner" // 👈 import sonner toast
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import CreateTaskDialog from "./task/CreateTaskDialog"

export default function NotificationProvider(): JSX.Element {
  const role=useCookies().get("role")
  const access_token=useCookies().get("access_token")
  const [dialogOpen, setDialogOpen] =  useState(false)
  const [prefillTitle, setPrefillTitle] = useState("")
  function notify(title: string, description?: string, avatar?: string) {
  const audio = new Audio("/bell.mp3")
  audio.play().catch(() => {}) // ignore autoplay errors

toast.custom((id) => (
  <div className="flex items-center gap-4 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg animate-slide-in">
    
    {avatar && (
      <img
        src={avatar}
        alt="avatar"
        className="h-10 w-10 rounded-full object-cover"
      />
    )}

    <div className="flex-1 space-y-1">
      <h1 className="text-sm font-semibold text-gray-900 leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-xs text-gray-500 leading-snug">
          {description}
        </p>
      )}

      <button
        onClick={() => {
          toast.dismiss(id)
          setPrefillTitle( title||"")
          setDialogOpen(true)
        }}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        + Create task
      </button>
    </div>

    <button
      onClick={() => toast.dismiss(id)}
      className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      aria-label="Close"
    >
      ✕
    </button>
  </div>
))

}
const pushTokenBackend = async (token: string) => {
    try {
      await fetch(`${API_URL}/api/device-tokens/update-token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ fcm_token:token,platform: "web",  "app_version": "1.0.0",
  "roles": [role] }),
      })
    } catch (err) {
      console.error("Error registering token with backend:", err)
    }
}

  useEffect(() => {
    if (!messaging) return

    Notification.requestPermission().then(async (permission) => {
      if (permission === "granted") {
        try {
          const token = await getToken(messaging as Messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          })
          if (token) {
            console.log("FCM Token:", token)
            pushTokenBackend(token)
            // send token to your backend
          }
        } catch (err) {
          console.error("Error getting token:", err)
        }
      }
    })

    onMessage(messaging as Messaging, (payload) => {
      console.log("Message received in foreground:", payload)
      if (payload.notification) {
        notify(payload.notification.title || "Notification", payload.notification.body,
          payload.notification.image || undefined
        )
      }
    })
  }, [])

  return (
    <>
    <CreateTaskDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        prefill={{ title: prefillTitle }} onTaskCreated={function (): void {
          throw new Error("Function not implemented.")
        } }    />
      
    </>
  )
}
