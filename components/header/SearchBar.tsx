"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Loader2 } from "lucide-react"
import Link from "next/link"
import API_URL from "@/app/utils/ENV"
import { useCookies } from "next-client-cookies"
import { debounce } from "lodash"

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

interface SearchResultItem extends MenuItem {
  parentPath?: string
}

const IconComponent = ({ iconName }: { iconName: string }) => {
  return (
    <span className="text-sm font-semibold" aria-label={iconName}>
      {iconName.charAt(0).toUpperCase()}
    </span>
  )
}

export function SearchBar() {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [hierarchicalMenu, setHierarchicalMenu] = useState<MenuItem[]>([])
  const [showResults, setShowResults] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const cookies = useCookies()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_URL}/roles/get-menu/?role=superadmin`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.get("access_token")}`,
          },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch menu")
        }
        const data: MenuResponse = await response.json()
        setHierarchicalMenu(data.menu.items)
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const flattenMenuItems = (items: MenuItem[], parentName: string = ""): SearchResultItem[] => {
    let result: SearchResultItem[] = []
    items.forEach((item) => {
      const searchItem: SearchResultItem = {
        ...item,
        parentPath: parentName,
      }
      result.push(searchItem)
      if (item.children && item.children.length > 0) {
        const newParentName = parentName ? `${parentName} > ${item.name}` : item.name
        result = result.concat(flattenMenuItems(item.children, newParentName))
      }
    })
    return result
  }

  const getParentPath = useCallback(
    (item: MenuItem): string => {
      const findParent = (items: MenuItem[], targetNav: string, path: string = ""): string => {
        for (const currentItem of items) {
          if (currentItem.nav === targetNav) {
            return path
          }
          if (currentItem.children && currentItem.children.length > 0) {
            const newPath = path ? `${path} > ${currentItem.name}` : currentItem.name
            const result = findParent(currentItem.children, targetNav, newPath)
            if (result) return result
          }
        }
        return ""
      }
      return findParent(hierarchicalMenu, item.nav)
    },
    [hierarchicalMenu]
  )

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="font-semibold text-orange-600 dark:text-orange-400">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.trim() === "") {
        setSearchResults([])
        setShowResults(false)
        return
      }

      const searchTermLower = term.toLowerCase()
      const searchWords = searchTermLower.split(/\s+/).filter((word) => word.length > 0)

      const filteredResults = menuItems.filter((item) => {
        const searchableText = `${item.name} ${item.tooltip}`.toLowerCase()
        return searchWords.every((word) => searchableText.includes(word))
      })

      const sortedResults = filteredResults
        .map((item) => ({
          ...item,
          parentPath: getParentPath(item),
        }))
        .sort((a, b) => {
          const aExactName = a.name.toLowerCase() === searchTermLower
          const bExactName = b.name.toLowerCase() === searchTermLower
          if (aExactName && !bExactName) return -1
          if (!aExactName && bExactName) return 1

          const aStartsWith = a.name.toLowerCase().startsWith(searchTermLower)
          const bStartsWith = b.name.toLowerCase().startsWith(searchTermLower)
          if (aStartsWith && !bStartsWith) return -1
          if (!aStartsWith && bStartsWith) return 1

          return a.name.length - b.name.length
        })

      setSearchResults(sortedResults.slice(0, 8))
      setShowResults(true)
      setActiveIndex(-1)
    }, 250),
    [menuItems, getParentPath]
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchTerm, debouncedSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleClear = () => {
    setSearchTerm("")
    setSearchResults([])
    setShowResults(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
      setSearchTerm("")
      setActiveIndex(-1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      const activeResult = searchResults[activeIndex]
      if (activeResult) {
        handleResultClick(activeResult.nav)
      }
    }
  }

  const handleResultClick = (nav: string) => {
    setShowResults(false)
    setSearchTerm("")
    setActiveIndex(-1)
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2  z-10 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder="Search menu..."
          className="pl-10 pr-10 h-10 w-[200px]"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.trim() && setShowResults(true)}
          disabled={isLoading}
          aria-label="Search menu items"
          autoComplete="off"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && searchTerm.trim() && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden"
        >
          {searchResults.length > 0 ? (
            <div className="overflow-y-auto max-h-96">
              {searchResults.map((item, index) => (
                <Link
                  key={index}
                  href={`/dashboard${item.nav}`}
                  onClick={() => handleResultClick(item.nav)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${activeIndex === index ? "bg-gray-50 dark:bg-gray-700" : ""
                    }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                    <IconComponent iconName={item.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {highlightText(item.name, searchTerm)}
                    </div>
                    {item.tooltip && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {item.tooltip}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}