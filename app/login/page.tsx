"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, GraduationCap, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const success = await login(email, password)
    if (!success) {
      setError("Credenciales incorrectas. Verifica tu usuario y contraseña.")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — imagen / branding */}
      <div className="hidden lg:flex lg:w-3/5 relative bg-[#0f1f3d] flex-col items-center justify-center p-12 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1f3d] via-[#1a3461] to-[#0f1f3d] opacity-90" />
        {/* Decorative circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-2xl" />

        <div className="relative z-10 text-center text-white">
          <div className="w-28 h-28 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-8 ring-2 ring-[#d4af37]/40">
            <GraduationCap className="w-16 h-16 text-[#d4af37]" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-white">Colegio El Dorado</h1>
          <p className="text-[#d4af37] text-xl font-medium mb-4">Comisión Disciplinaria</p>
          <div className="w-20 h-0.5 bg-[#d4af37]/50 mx-auto mb-6" />
          <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
            Sistema de gestión de infracciones escolares. Formando ciudadanos con valores y excelencia académica.
          </p>
        </div>
      </div>

      {/* Right — formulario */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#0f1f3d] rounded-full flex items-center justify-center mb-3">
              <GraduationCap className="w-8 h-8 text-[#d4af37]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0f1f3d]">Colegio El Dorado</h1>
            <p className="text-[#d4af37] text-sm font-medium">Comisión Disciplinaria</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Usuario / Código
              </Label>
              <Input
                id="email"
                type="text"
                placeholder="usuario@colegio.edu o código"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-gray-200 focus:border-[#0f1f3d] focus:ring-[#0f1f3d]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 border-gray-200 focus:border-[#0f1f3d] focus:ring-[#0f1f3d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#0f1f3d] hover:bg-[#1a3461] text-white font-medium"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Credenciales de prueba
            </p>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Admin</span>
                <span className="font-mono">admin@colegiodorado.edu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Regente</span>
                <span className="font-mono">regente.garcia@colegiodorado.edu</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estudiante</span>
                <span className="font-mono">1001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Contraseña</span>
                <span className="font-mono">cualquiera</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}