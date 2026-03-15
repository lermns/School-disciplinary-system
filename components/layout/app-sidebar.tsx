"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, Users, FileText, ClipboardList, BarChart3,
  History, BookOpen, LogOut, ShieldCheck, Menu, X, Sun, Moon, GraduationCap,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type NavItem = { label: string; href: string; icon: React.ElementType }

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Estudiantes", href: "/dashboard/admin/estudiantes", icon: Users },
  { label: "Infracciones", href: "/dashboard/admin/infracciones", icon: ClipboardList },
  { label: "Tipos de Falta", href: "/dashboard/admin/tipos-falta", icon: FileText },
  { label: "Regente", href: "/dashboard/admin/regentes", icon: ShieldCheck },
  { label: "Profesores", href: "/dashboard/admin/profesores", icon: GraduationCap },
  { label: "Reportes", href: "/dashboard/admin/reportes", icon: BarChart3 },
  { label: "Configuración", href: "/dashboard/admin/configuracion", icon: Settings },
]

const regenteNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/regente", icon: LayoutDashboard },
  { label: "Mi Historial", href: "/dashboard/regente/historial", icon: History },
]

const estudianteNav: NavItem[] = [
  { label: "Mi Perfil", href: "/dashboard/estudiante", icon: LayoutDashboard },
]

const profesorNav: NavItem[] = [
  { label: "Mis Estudiantes", href: "/dashboard/profesor", icon: LayoutDashboard },
  { label: "Mi Historial", href: "/dashboard/profesor/historial", icon: History },
]

function getRolLabel(rol: string) {
  switch (rol) {
    case "admin": return "Administrador"
    case "regente": return "Regente"
    case "estudiante": return "Estudiante"
    case "profesor": return "Profesor"
    default: return rol
  }
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  let navItems: NavItem[] = []
  switch (user?.rol) {
    case "admin": navItems = adminNav; break
    case "regente": navItems = regenteNav; break
    case "estudiante": navItems = estudianteNav; break
    case "profesor": navItems = profesorNav; break
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <ShieldCheck className="size-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-sidebar-foreground">El Dorado</p>
            <p className="text-[10px] text-sidebar-foreground/50">Sistema Disciplinario</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden">
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(item => {
            const basePath = `/dashboard/${user?.rol}`
            const isActive = item.href === basePath
              ? pathname === item.href
              : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />

      {/* User footer */}
      <div className="flex items-center gap-2 p-4">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {user ? getInitials(user.nombre_completo) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground">{user?.nombre_completo}</p>
          <p className="truncate text-[10px] text-sidebar-foreground/50">{user ? getRolLabel(user.rol) : ""}</p>
        </div>
        <Button variant="ghost" size="icon"
          className="size-8 shrink-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button variant="ghost" size="icon"
          className="size-8 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
          onClick={logout} title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      <aside className="hidden h-full w-64 flex-col border-r lg:flex">
        <SidebarContent />
      </aside>
    </>
  )
}