import type React from "react"
import ClientLayout from "./clientLayout"
import Messagebox from "@/components/Messagebox"




export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>
    <Messagebox/>
    {children}</ClientLayout>
}
