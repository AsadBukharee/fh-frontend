"use client"
import { useEffect } from "react"
import { Messaging, getToken, onMessage } from "firebase/messaging"
import { messaging } from "@/app/FCM/firebase"
import { toast } from "sonner" // 👈 import sonner toast
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"

export default function NotificationProvider(): null {
  const role=useCookies().get("role")
  const access_token=useCookies().get("access_token")
  function notify(title: string, description?: string, avatar?: string) {
  const audio = new Audio("/bell.mp3")
  audio.play().catch(() => {}) // ignore autoplay errors

toast.custom((id) => (
    <div className="flex items-start gap-3 rounded-md border bg-white p-4 shadow-lg w-80">
      {avatar && (
        <img
          src={avatar}
          alt="avatar"
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
      <div className="flex-1">
        <h1 className="font-semibold text-sm">{title}</h1>
        {description && (
          <p className="text-xs text-gray-600">{description}</p>
        )}
      </div>
      <button
        onClick={() => toast.dismiss(id)}
        className="ml-2 text-gray-400 hover:text-gray-600"
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

  return null
}
