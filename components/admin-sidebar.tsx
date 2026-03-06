"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    FileText,
    AlertTriangle,
    Menu,
    X,
    GraduationCap,
    LogOut,
    ChevronLeft,
    Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const adminNav = [
    { href: "/dashboard/admin", icon: LayoutDashboard, label: "Inicio" },
    { href: "/dashboard/admin/estudiantes", icon: Users, label: "Estudiantes" },
    { href: "/dashboard/admin/infracciones", icon: FileText, label: "Infracciones" },
    { href: "/dashboard/admin/tipos-falta", icon: AlertTriangle, label: "Tipos de Falta" },
    { href: "/dashboard/admin/regentes", icon: Settings, label: "Regentes" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
        const isActive = pathname === href || (href !== "/dashboard/admin" && pathname.startsWith(href))
        return (
            <Link
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                        ? "bg-[#d4af37]/20 text-[#d4af37]"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                )}
            >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
            </Link>
        )
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0f1f3d]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#d4af37]/20 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">El Dorado</p>
                            <p className="text-white/40 text-xs">Administrador</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex text-white/40 hover:text-white p-1 rounded"
                >
                    <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
                </button>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden text-white/40 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {adminNav.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>

            {/* User + logout */}
            <div className="p-3 border-t border-white/10">
                {!collapsed && (
                    <div className="px-3 py-2 mb-1">
                        <p className="text-white text-sm font-medium truncate">{user?.nombre_completo}</p>
                        <p className="text-white/40 text-xs truncate">{user?.email}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Cerrar sesión</span>}
                </button>
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 bg-[#0f1f3d] text-white p-2 rounded-lg shadow-lg"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="w-64 h-full">
                        <SidebarContent />
                    </div>
                    <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
                </div>
            )}

            {/* Desktop sidebar */}
            <div className={cn("hidden lg:flex h-full transition-all duration-200", collapsed ? "w-16" : "w-60")}>
                <SidebarContent />
            </div>
        </>
    )
}