"use client"

import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/layout/app-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()

  // Mostrar spinner mientras:
  // - se restaura la sesión (!isInitialized)
  // - o el user todavía no llegó (!user)
  // NO redirigir desde acá — el middleware protege las rutas,
  // y logout() ya hace router.push("/login")
  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 pt-16 lg:p-6 lg:pt-6">{children}</div>
      </main>
    </div>
  )
}