"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { User, Session } from "@supabase/supabase-js"
import { AuthModal } from "@/components/auth/auth-modal"

interface AuthContextType {
    user: User | null
    session: Session | null
    role: "admin" | "customer" | null
    isLoading: boolean
    openAuthModal: () => void
    closeAuthModal: () => void
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<"admin" | "customer" | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchRole = useCallback(async (userId: string) => {
        try {
            // First check user metadata as it might be faster if synced
            // Otherwise fetch from profiles
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (error) {
                console.error("Error fetching role:", error)
                return
            }

            if (data) {
                setRole(data.role as "admin" | "customer")
            }
        } catch (error) {
            console.error("Error in fetchRole:", error)
        }
    }, [supabase])

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchRole(session.user.id)
                }
            } catch (error) {
                console.error("Error fetching session:", error)
            } finally {
                setIsLoading(false)
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                await fetchRole(session.user.id)
            } else {
                setRole(null)
            }

            setIsLoading(false)
        })

        fetchSession()

        return () => {
            subscription.unsubscribe()
        }
    }, [supabase, fetchRole])

    const signOut = async () => {
        // Clear local state
        setUser(null)
        setSession(null)
        setRole(null)
        // Hard redirect to server route to wipe cookies securely
        window.location.href = "/auth/signout"
    }

    const openAuthModal = () => setIsModalOpen(true)
    const closeAuthModal = () => setIsModalOpen(false)

    return (
        <AuthContext.Provider value={{
            user,
            session,
            role,
            isLoading,
            openAuthModal,
            closeAuthModal,
            signOut
        }}>
            {children}
            <AuthModal isOpen={isModalOpen} onClose={closeAuthModal} />
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
