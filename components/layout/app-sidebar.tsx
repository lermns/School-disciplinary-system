"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  BarChart3,
  PlusCircle,
  History,
  BookOpen,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Estudiantes", href: "/dashboard/admin/estudiantes", icon: Users },
  { label: "Infracciones", href: "/dashboard/admin/infracciones", icon: ClipboardList },
  { label: "Tipos de Falta", href: "/dashboard/admin/tipos-falta", icon: FileText },
  { label: "Regentes", href: "/dashboard/admin/regentes", icon: ShieldCheck },
  { label: "Reportes", href: "/dashboard/admin/reportes", icon: BarChart3 },
]

const regenteNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/regente", icon: LayoutDashboard },
  { label: "Registrar Infracción", href: "/dashboard/regente/registrar", icon: PlusCircle },
  { label: "Mi Historial", href: "/dashboard/regente/historial", icon: History },
]

const estudianteNav: NavItem[] = [
  { label: "Mi Perfil", href: "/dashboard/estudiante", icon: LayoutDashboard },
  { label: "Mis Infracciones", href: "/dashboard/estudiante/infracciones", icon: BookOpen },
]

function getRolLabel(rol: string) {
  switch (rol) {
    case "admin":
      return "Administrador"
    case "regente":
      return "Regente"
    case "estudiante":
      return "Estudiante"
    default:
      return rol
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  let navItems: NavItem[] = []
  switch (user?.rol) {
    case "admin":
      navItems = adminNav
      break
    case "regente":
      navItems = regenteNav
      break
    case "estudiante":
      navItems = estudianteNav
      break
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck className="size-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">
            El Dorado
          </p>
          <p className="text-[10px] text-sidebar-foreground/50">
            Sistema Disciplinario
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === `/dashboard/${user?.rol}`
                ? pathname === item.href
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
      <div className="flex items-center gap-3 p-4">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {user ? getInitials(user.nombre_completo) : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground">
            {user?.nombre_completo}
          </p>
          <p className="truncate text-[10px] text-sidebar-foreground/50">
            {user ? getRolLabel(user.rol) : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-sidebar-foreground/50 hover:text-destructive"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  )
}