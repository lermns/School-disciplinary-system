"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  LayoutDashboard,
  Users,
  AlertTriangle,
  GraduationCap,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
  History,
  Heart,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Estudiantes", href: "/dashboard/admin/estudiantes", icon: Users },
  {
    label: "Infracciones",
    href: "/dashboard/admin/infracciones",
    icon: AlertTriangle,
  },
  {
    label: "Profesores",
    href: "/dashboard/admin/profesores",
    icon: GraduationCap,
  },
  { label: "Padres", href: "/dashboard/admin/padres", icon: UserCheck },
  {
    label: "Tipos de Falta",
    href: "/dashboard/admin/tipos-falta",
    icon: ClipboardList,
  },
  { label: "Reportes", href: "/dashboard/admin/reportes", icon: FileText },
  {
    label: "Configuración",
    href: "/dashboard/admin/configuracion",
    icon: Settings,
  },
]

const profesorNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/profesor", icon: LayoutDashboard },
  {
    label: "Estudiantes",
    href: "/dashboard/profesor/estudiantes",
    icon: Users,
  },
  {
    label: "Registrar Infracción",
    href: "/dashboard/profesor/registrar",
    icon: AlertTriangle,
  },
  {
    label: "Mi Historial",
    href: "/dashboard/profesor/historial",
    icon: History,
  },
]

const padreNav: NavItem[] = [
  { label: "Mis Hijos", href: "/dashboard/padre", icon: Heart },
  {
    label: "Historial de Faltas",
    href: "/dashboard/padre/mis-hijos",
    icon: History,
  },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

function getRolLabel(rol: string) {
  switch (rol) {
    case "admin":
      return "Administrador"
    case "profesor":
      return "Profesor"
    case "padre":
      return "Padre de Familia"
    default:
      return rol
  }
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  if (!user) return null

  const navItems =
    user.rol === "admin"
      ? adminNav
      : user.rol === "profesor"
        ? profesorNav
        : padreNav

  const isActive = (href: string) => {
    if (href === `/dashboard/${user.rol}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn("flex items-center gap-3 p-4", collapsed && "justify-center px-2")}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Image src={"/images/logodorado.png"} alt="El Dorado" className="size-full object-cover" width={"100"} height={"100"} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-sidebar-foreground">
              Colegio El Dorado
            </h2>
            <p className="truncate text-xs text-sidebar-foreground/60">
              Comisión Disciplinaria
            </p>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User Card */}
      <div className={cn("flex items-center gap-3 p-4", collapsed && "justify-center px-2")}>
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            {getInitials(user.nombre_completo)}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.nombre_completo}
            </p>
            <Badge
              variant="outline"
              className="mt-0.5 border-sidebar-primary/30 text-sidebar-primary text-[10px]"
            >
              {getRolLabel(user.rol)}
            </Badge>
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return linkContent
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 p-2">
        <Separator className="mb-2 bg-sidebar-border" />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          {theme === "dark" ? (
            <Sun className="size-4.5 shrink-0" />
          ) : (
            <Moon className="size-4.5 shrink-0" />
          )}
          {!collapsed && (
            <span>{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="size-4.5 shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir menú"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="relative h-full">
          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-7 z-10 flex size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <svg
              className={cn(
                "size-3 transition-transform",
                collapsed && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
