"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { debounce } from "lodash"

// Define interfaces for menu items
interface MenuItem {
  nav: string
  icon: string
  name: string
  tooltip: string
  children: MenuItem[]
  isSelected: boolean
}

interface MenuResponse {
  menu: {
    items: MenuItem[]
  }
}

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const cookies = useCookies()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/roles/get-menu/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cookies.get("access_token")}`
          }
        })
        if (!response.ok) {
          throw new Error("Failed to fetch menu")
        }
        const data: MenuResponse = await response.json()
        const flattenedItems = flattenMenuItems(data.menu.items)
        setMenuItems(flattenedItems)
      } catch (error) {
        console.error("Error fetching menu:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMenu()
  }, [cookies])

  // Flatten nested menu items
  const flattenMenuItems = (items: MenuItem[]): MenuItem[] => {
    let result: MenuItem[] = []
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenMenuItems(item.children))
      }
    })
    return result
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim() === "") {
        setSearchResults([])
        return
      }
      const filteredResults = menuItems.filter(item =>
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.tooltip.toLowerCase().includes(term.toLowerCase())
      )
      setSearchResults(filteredResults)
    }, 300),
    [menuItems]
  )

  // Update search results when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => {
      debouncedSearch.cancel() // Cleanup debounce on unmount
    }
  }, [searchTerm, debouncedSearch])

  // Handle keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchTerm("")
      inputRef.current?.focus()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([])
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative gradient-border cursor-glow" ref={searchRef}>
      {isLoading ? (
        <div className="flex items-center justify-center p-2 text-gray-500">
          <span>Loading...</span>
        </div>
      ) : (
        <>
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
            aria-hidden="true"
          />
          <Input
            ref={inputRef}
            placeholder="Search"
            className="pl-10 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search menu items"
            autoComplete="off"
          />
          {searchResults.length > 0 && (
            <div
              className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-y-auto z-20"
              role="listbox"
              aria-label="Search results"
            >
              {searchResults.map((item, index) => (
                <Link
                  key={index}
                  href={item.nav}
                  className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 outline-none"
                  role="option"
                  aria-selected={item.isSelected}
                  tabIndex={0}
                >
                  <span className="mr-2" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.tooltip}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}