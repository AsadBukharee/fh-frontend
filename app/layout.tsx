import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "./Context/ToastContext";
import { CookiesProvider } from "next-client-cookies/server";
import { WebSocketProvider } from "@/lib/WebSocketContext";
import { cookies } from "next/headers"; // ✅ correct import

export const metadata: Metadata = {
  title: "Foster Hartley - Vehicle Management",
  description: "Foster Hartley vehicle management dashboard",
  generator: "v0.dev",
  icons: {
    icon: "/icons/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies(); // ✅ get cookies from Next.js
  const token = cookieStore.get("access_token")?.value; // ✅ extract token safely

  return (
    <html lang="en">
      <body>
        <CookiesProvider>
          <ToastProvider>
          
            
            <WebSocketProvider token={token}>
              {children}
            </WebSocketProvider>
          </ToastProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
