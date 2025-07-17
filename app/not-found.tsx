import Link from "next/link"
import { Construction } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center space-y-6 bg-gray-50 dark:bg-gray-900 p-4">
      <Construction className="h-24 w-24 text-orange animate-bounce" />
      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-800 dark:text-gray-100">{"Under Construction"}</h1>
      <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-md">
        {"We're working hard to bring you something amazing. Please check back soon!"}
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-md bg-magenta px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:opacity-80 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        Go back home
      </Link>
    </div>
  )
}
