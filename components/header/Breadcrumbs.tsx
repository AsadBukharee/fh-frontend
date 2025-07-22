'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Breadcrumbs() {
  const pathname = usePathname();

  // Split pathname into segments and filter empty
  const pathSegments = pathname.split('/').filter(Boolean);

  // Build breadcrumb links
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    return { label, path };
  });

  return (
    <nav aria-label="breadcrumb" className="flex items-center space-x-2 text-sm text-gray-600">
      {/* <Link href="/" className="hover:text-gray-900 hover:underline">Home</Link> */}
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
