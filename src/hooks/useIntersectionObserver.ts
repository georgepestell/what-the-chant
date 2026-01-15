import { useEffect, useRef } from 'react'

interface UseIntersectionObserverProps {
    onIntersect: () => void
    enabled?: boolean
    threshold?: number
    rootMargin?: string
}

export const useIntersectionObserver = ({
    onIntersect,
    enabled = true,
    threshold = 0.1,
    rootMargin = '100px',
}: UseIntersectionObserverProps) => {
    const targetRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!enabled || !targetRef.current) return

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry?.isIntersecting) {
                    onIntersect()
                }
            },
            { threshold, rootMargin },
        )

        observer.observe(targetRef.current)

        return () => {
            observer.disconnect()
        }
    }, [enabled, onIntersect, threshold, rootMargin])

    return targetRef
}
