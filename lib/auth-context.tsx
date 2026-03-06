"use client"

import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Usuario } from "@/lib/types"
import { mockUsuarios } from "@/lib/mock-data"

interface AuthContextType {
  user: Usuario | null
  login: (emailOrCode: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const stored = sessionStorage.getItem("colegio_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const login = useCallback(
    async (emailOrCode: string, _password: string) => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 800))

      const foundUser = mockUsuarios.find(
        (u) => u.email.toLowerCase() === emailOrCode.toLowerCase()
      )

      if (foundUser) {
        setUser(foundUser)
        sessionStorage.setItem("colegio_user", JSON.stringify(foundUser))
        setIsLoading(false)

        switch (foundUser.rol) {
          case "admin":
            router.push("/dashboard/admin")
            break
          case "regente":
            router.push("/dashboard/regente")
            break
          case "estudiante":
            router.push("/dashboard/estudiante")
            break
        }
        return true
      }

      setIsLoading(false)
      return false
    },
    [router]
  )

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem("colegio_user")
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}