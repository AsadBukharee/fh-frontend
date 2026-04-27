"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * A custom hook to handle auto-scrolling to an element after data loads.
 * @param loading Boolean indicating if data is currently loading/refreshing.
 * @param keyPrefix Prefix for the sessionStorage key to prevent collisions across pages.
 * @param scrollMargin Optional margin from the top to scroll to.
 */
export function useAutoScroll(loading: boolean, keyPrefix: string, isMultiple = false) {
  const [expandedId, setExpandedId] = useState<string | string[] | undefined>(
    isMultiple ? [] : undefined
  );
  const shouldScrollRef = useRef<boolean>(false);

  // Hydrate expanded state from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`expandedItem_${keyPrefix}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setExpandedId(parsed);
        } catch {
          setExpandedId(saved);
        }
      }
    }
  }, [keyPrefix]);

  // Handler to update the expanded item and save it to sessionStorage
  const handleExpandedChange = useCallback((value: string | string[] | undefined) => {
    setExpandedId(value);
    if (typeof window !== "undefined") {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        sessionStorage.setItem(`expandedItem_${keyPrefix}`, typeof value === "string" ? value : JSON.stringify(value));
      } else {
        sessionStorage.removeItem(`expandedItem_${keyPrefix}`);
      }
    }
  }, [keyPrefix]);

  // Track when loading happens to trigger a scroll after it finishes
  useEffect(() => {
    if (loading) {
      shouldScrollRef.current = true;
    }
  }, [loading]);

  // Scroll to expanded item after loading
  useEffect(() => {
    if (!loading && expandedId && shouldScrollRef.current) {
      const timer = setTimeout(() => {
        // If it's an array, scroll to the last item (most recently opened usually)
        const targetId = Array.isArray(expandedId) ? expandedId[expandedId.length - 1] : expandedId;
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        shouldScrollRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, expandedId]);

  return { expandedId, handleExpandedChange, setExpandedId };
}
