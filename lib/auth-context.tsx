"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import type { Usuario } from "@/lib/types"

interface AuthContextType {
  user: Usuario | null
  login: (emailOrCode: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  async function loadProfile(authUser: { id: string; email?: string }): Promise<Usuario | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      email: authUser.email ?? "",
      nombre_completo: data.nombre_completo,
      rol: data.rol,
      avatar_url: null,
      created_at: data.created_at,
      estudiante_id: data.estudiante_id ?? undefined,
    }
  }

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user)
        setUser(profile)
      }
      setIsInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await loadProfile(session.user)
          setUser(profile)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback(async (emailOrCode: string, password: string) => {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrCode,
      password,
    })
    console.log("ERROR COMPLETO:", JSON.stringify(error, null, 2))
    console.log("STATUS:", error?.status)
    console.log("MESSAGE:", error?.message)

    if (error || !data.user) {
      setIsLoading(false)
      return false
    }

    const profile = await loadProfile(data.user)

    if (!profile) {
      await supabase.auth.signOut()
      setIsLoading(false)
      return false
    }

    setUser(profile)
    setIsLoading(false)

    switch (profile.rol) {
      case "admin": router.push("/dashboard/admin"); break
      case "regente": router.push("/dashboard/regente"); break
      case "estudiante": router.push("/dashboard/estudiante"); break
    }

    return true
  }, [router])

  const logout = useCallback(async () => {
    const supabase = createClient()
    setUser(null)           // primero limpiar el estado local
    await supabase.auth.signOut()
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return context
}