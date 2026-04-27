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
          if (isMultiple) {
            setExpandedId(Array.isArray(parsed) ? parsed : [parsed]);
          } else {
            setExpandedId(Array.isArray(parsed) ? parsed[0] : parsed);
          }
        } catch {
          setExpandedId(isMultiple ? [saved] : saved);
        }
      }
    }
  }, [keyPrefix, isMultiple]);

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
      console.log(`[useAutoScroll] Loading finished. Target ID(s):`, expandedId);
      
      const targetId = Array.isArray(expandedId) 
        ? expandedId[expandedId.length - 1] 
        : expandedId;

      if (!targetId) {
        shouldScrollRef.current = false;
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;

      const attemptScroll = () => {
        const el = document.getElementById(targetId);
        if (el) {
          console.log(`[useAutoScroll] Found element! Scrolling to:`, targetId);
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          shouldScrollRef.current = false;
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(attemptScroll, 100);
        } else {
          console.warn(`[useAutoScroll] Could not find element with ID:`, targetId, `after ${maxAttempts} attempts.`);
          shouldScrollRef.current = false;
        }
      };

      const timer = setTimeout(attemptScroll, 300);
      return () => {
        clearTimeout(timer);
        shouldScrollRef.current = false;
      };
    }
  }, [loading, expandedId, keyPrefix]);

  return { expandedId, handleExpandedChange, setExpandedId };
}
