import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      // Use viewport width or fallback to innerWidth for better cross-environment consistency
      const currentWidth = window.visualViewport?.width || window.innerWidth
      setIsMobile(currentWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Initial check with environment-aware width detection
    const currentWidth = window.visualViewport?.width || window.innerWidth
    setIsMobile(currentWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
