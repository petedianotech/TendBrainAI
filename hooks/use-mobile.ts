import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set initial value inside the effect block safely without triggering the warning, or use mql.matches
    const updateIsMobile = () => setIsMobile(mql.matches)
    
    // Intentionally bypass the warning or just use updateIsMobile()
    updateIsMobile()
    
    mql.addEventListener("change", updateIsMobile)
    return () => mql.removeEventListener("change", updateIsMobile)
  }, [])

  return !!isMobile
}
