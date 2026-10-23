import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function matchesReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  )
}

/** Tracks `prefers-reduced-motion: reduce` for JS-gated motion (e.g. press timing). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(matchesReducedMotion)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => {
      setReduced(mq.matches)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [])

  return reduced
}
