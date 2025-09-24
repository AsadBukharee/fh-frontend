import type React from "react"
import ClientLayout from "./clientLayout"
import Messagebox from "@/components/Messagebox"
import { ToastProvider } from "@/app/Context/ToastContext"
import NotificationDisplay from "@/components/NotificationDisplay"

import { Toaster } from "sonner"



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>
    <ToastProvider>
    <Messagebox/>
    <Toaster
  position="top-right"   // "top-left" | "bottom-right" | etc
  richColors             // enable preset success/error colors
  expand                 // expands width for long messages
  duration={10000}        // default auto close
  closeButton            // add X button to each toast
/>
    {children}
    </ToastProvider>
    </ClientLayout>
}
