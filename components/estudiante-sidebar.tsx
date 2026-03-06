"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { LayoutDashboard, GraduationCap, LogOut, Menu, X } from "lucide-react"

const estudianteNav = [
    { href: "/dashboard/estudiante", icon: LayoutDashboard, label: "Mis infracciones" },
]

export function EstudianteSidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [mobileOpen, setMobileOpen] = useState(false)

    const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
        const isActive = pathname === href
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
                <span>{label}</span>
            </Link>
        )
    }

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#0f1f3d]">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#d4af37]/20 rounded-lg flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm">El Dorado</p>
                        <p className="text-white/40 text-xs">Estudiante</p>
                    </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="lg:hidden text-white/40 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {estudianteNav.map((item) => (
                    <NavLink key={item.href} {...item} />
                ))}
            </nav>

            <div className="p-3 border-t border-white/10">
                <div className="px-3 py-2 mb-1">
                    <p className="text-white text-sm font-medium truncate">{user?.nombre_completo}</p>
                    <p className="text-white/40 text-xs">Código: {user?.email}</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </div>
    )

    return (
        <>
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 bg-[#0f1f3d] text-white p-2 rounded-lg shadow-lg"
            >
                <Menu className="w-5 h-5" />
            </button>

            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="w-64 h-full"><SidebarContent /></div>
                    <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
                </div>
            )}

            <div className="hidden lg:flex h-full w-60">
                <SidebarContent />
            </div>
        </>
    )
}