import type { Metadata } from "next";

import "./globals.css";
import { ToastProvider } from "./Context/ToastContext";



export const metadata: Metadata = {
  title: "Foster Hartley - Vehicle Management",
  description: "Foster Hartley vehicle management dashboard",
  generator: 'v0.dev',
  icons: {
    icon: '/icons/favicon.ico',
  }
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      
      >
    <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
