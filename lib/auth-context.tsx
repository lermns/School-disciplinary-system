"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Session, AuthChangeEvent } from "@supabase/supabase-js"
import type { Usuario, Rol } from "@/lib/types"

let _client: ReturnType<typeof createBrowserClient> | null = null
function supabase() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}

async function fetchProfile(session: Session): Promise<Usuario | null> {
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1]))
    if (!payload.rol) return null
    return {
      id: session.user.id,
      email: session.user.email ?? "",
      nombre_completo: payload.nombre_completo ?? "",
      rol: payload.rol as Rol,
      avatar_url: null,
      created_at: session.user.created_at,
      estudiante_id: payload.estudiante_id ?? undefined,
    }
  } catch {
    return null
  }
}

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
  // Evita setState en componente desmontado
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    const { data: { subscription } } = supabase().auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        // NO async aquí — lanzamos la promise pero sin await
        if (session) {
          fetchProfile(session).then(profile => {
            if (!mounted.current) return
            setUser(profile)
            setIsInitialized(true)
          })
        } else {
          if (!mounted.current) return
          setUser(null)
          setIsInitialized(true)
        }
      }
    )

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (emailOrCode: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Si no tiene @ es un código de estudiante → construir el email completo
    const email = emailOrCode.includes("@")
      ? emailOrCode
      : `${emailOrCode}@colegiodorado.edu`

    const { data, error } = await supabase().auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      setIsLoading(false)
      return false
    }

    const profile = await fetchProfile(data.session)

    if (!profile) {
      await supabase().auth.signOut()
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
    await supabase().auth.signOut()
    setUser(null)
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
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}