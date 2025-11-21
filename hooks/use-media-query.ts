"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect media query matches (e.g., mobile vs desktop)
 * Returns false during SSR to prevent hydration mismatches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [query])

  // Prevent hydration mismatch by returning false until mounted
  if (!mounted) {
    return false
  }

  return matches
}
