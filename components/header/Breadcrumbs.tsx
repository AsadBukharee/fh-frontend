'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Breadcrumbs() {
  const pathname = usePathname();

  // Split pathname into segments and filter empty
  const pathSegments = pathname.split('/').filter(Boolean);

  // Build breadcrumb links
  const breadcrumbs = pathSegments.map((segment, index) => {
    // Construct the path
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    // Transform "su" to "SU" in the path
    const transformedPath = path.replace(/\bsu\b/gi, "SU");

    // Create the label: Split by hyphens or spaces, capitalize first letter of each word, and transform "su" to "SU"
    const label = segment
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .split(' ') // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
      .join(' '); // Rejoin with spaces
    const transformedLabel = label.replace(/\bsu\b/gi, "SU");

    return { label: transformedLabel, path: transformedPath };
  });

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-gray-600">
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.path}
              className="hover:text-gray-900 hover:underline"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}