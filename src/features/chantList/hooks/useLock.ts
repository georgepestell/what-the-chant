import { useState } from 'react'

export const useLock = () => {
    const [isLocked, setIsLocked] = useState(false)

    const toggleLock = () => {
        setIsLocked(!isLocked)
    }

    return {
        isLocked,
        toggleLock,
    }
}
