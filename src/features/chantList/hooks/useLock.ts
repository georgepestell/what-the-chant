import { useState, useEffect } from 'react'

const LOCK_STATUS_KEY = 'chant-app-locked-status'

export const useLock = () => {
    // Initialize state from localStorage
    const [isLocked, setIsLocked] = useState(() => {
        try {
            const savedLockStatus = localStorage.getItem(LOCK_STATUS_KEY)
            return savedLockStatus ? JSON.parse(savedLockStatus) : false
        } catch (error) {
            console.error('Error reading lock status from localStorage:', error)
            return false
        }
    })

    // Save to localStorage whenever lock status changes
    useEffect(() => {
        try {
            localStorage.setItem(LOCK_STATUS_KEY, JSON.stringify(isLocked))
        } catch (error) {
            console.error('Error saving lock status to localStorage:', error)
        }
    }, [isLocked])

    const toggleLock = () => {
        setIsLocked(!isLocked)
    }

    return {
        isLocked,
        toggleLock,
    }
}
