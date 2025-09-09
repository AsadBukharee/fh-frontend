import type React from "react"
import ClientLayout from "./clientLayout"
import Messagebox from "@/components/Messagebox"
import { ToastProvider } from "@/app/Context/ToastContext"




export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>
    <ToastProvider>
    <Messagebox/>
    {children}
    </ToastProvider>
    </ClientLayout>
}
