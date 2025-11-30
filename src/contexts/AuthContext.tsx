import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react'
import Cookies from 'js-cookie'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    user: User | null
    session: Session | null
    loading: boolean
    isAdmin: boolean
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext }

interface AuthProviderProps {
    children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    // Helper to sync session to cookie
    const syncSessionToCookie = (session: Session | null) => {
        if (session) {
            Cookies.set('supabaseSession', JSON.stringify(session), { expires: 30 })
        } else {
            Cookies.remove('supabaseSession')
        }
    }

    useEffect(() => {
        // Try to restore session from cookie first
        const cookieSession = Cookies.get('supabaseSession')
        if (cookieSession) {
            try {
                const parsed = JSON.parse(cookieSession)
                setSession(parsed)
                setUser(parsed.user ?? null)
            } catch {
                // Ignore invalid session cookie
            }
        }

        // Get initial session from Supabase
        const getInitialSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
            syncSessionToCookie(session)

            // Check admin status for existing session
            if (session?.user?.id) {
                const userId = session.user.id
                const storedAdminStatus = localStorage.getItem(`isAdmin_${userId}`)
                if (storedAdminStatus !== null) {
                    setIsAdmin(storedAdminStatus === 'true')
                }
            }
        }

        getInitialSession()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
            syncSessionToCookie(session)

            // Check admin status on sign in
            if (event === 'SIGNED_IN' && session?.user?.id) {
                const userId = session.user.id
                const storedAdminStatus = localStorage.getItem(`isAdmin_${userId}`)

                if (storedAdminStatus !== null) {
                    setIsAdmin(storedAdminStatus === 'true')
                } else {
                    const { data, error } = await supabase.rpc('is_admin', { p_user_id: userId })
                    if (!error && data !== null) {
                        setIsAdmin(data)
                        localStorage.setItem(`isAdmin_${userId}`, String(data))
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                setIsAdmin(false)
                // Clear all admin status from localStorage
                const keys = Object.keys(localStorage)
                for (const key of keys) {
                    if (key.startsWith('isAdmin_')) {
                        localStorage.removeItem(key)
                    }
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signIn = useCallback(async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({ email, password })
    }, [])

    const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
        return await supabase.auth.signUp({ email, password, options: metadata ? { data: metadata } : undefined })
    }, [])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
    }, [])

    const deleteAccount = useCallback(async () => {
        if (!user) throw new Error('No user to delete')

        try {
            // Call RPC function that will verify the user can only delete their own account
            const { error } = await supabase.rpc('delete_own_account')

            if (error) throw error

            // Sign out after successful deletion
            await signOut()
        } catch (error) {
            console.error('Delete account error:', error)
            throw new Error('Failed to delete account. Please try again.')
        }
    }, [user, signOut])

    const value = useMemo(
        () => ({
            user,
            session,
            loading,
            isAdmin,
            signIn,
            signUp,
            signOut,
            deleteAccount,
        }),
        [user, session, loading, isAdmin, signIn, signUp, signOut, deleteAccount],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
