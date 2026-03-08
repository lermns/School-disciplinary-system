"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().min(4, "Ingresa un usuario válido"),
  password: z.string().min(6, "La contraseña es requerida"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    const success = await login(data.email, data.password)
    if (success) {
      toast.success("Bienvenido al sistema")
    } else {
      toast.error("Credenciales inválidas. Intenta de nuevo.")
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[60%] lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/eldorado.jpg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.18_0.05_250/0.85)] via-[oklch(0.2_0.06_250/0.7)] to-[oklch(0.15_0.04_250/0.9)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          {/* Top - School name */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gold/20 backdrop-blur-sm">
                <img
                  src="/images/logodorado.png"
                  alt="Logo"
                  className="size-15 object-contain"
                />
              </div>

              <div>
                <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
                  Modulo Educativo El Dorado
                </h1>
                <p className="text-base font-medium text-gold/90">
                  Comisión Disciplinaria
                </p>
              </div>
            </div>
          </div>

          {/* Middle - Decorative */}
          <div className="max-w-lg">
            <blockquote className="space-y-3">
              <p className="text-lg leading-relaxed text-white/80 italic">
                {
                  '"Educamos con disciplina, formamos con valores. Nuestro compromiso es construir ciudadanos íntegros para el futuro."'
                }
              </p>
            </blockquote>
          </div>

          {/* Bottom - Copyright */}
          <p className="text-xs text-white/50">
            {
              "© 2026 Todos los derechos reservados. Desarrollado por Leonardo Ramos."
            }
          </p>
        </div>
      </div>


      {/* Right — formulario */}
      {/* Form Container */}

      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Icon & Title */}
          <div className="space-y-2 text-center">
            <div className="hidden lg:block">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary">
                <GraduationCap className="size-7 text-primary-foreground" />
              </div>
            </div>

            <div className="lg:hidden flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-xl bg-gold/20 backdrop-blur-sm">
                <img
                  src="/images/logodorado.png"
                  alt="Logo"
                  className="size-22 object-contain"
                />
              </div>
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="text" className="text-sm font-medium text-foreground">
                Nombre de usuario
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="usuario"
                  className="h-11 pl-10"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  className="h-11 pl-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-sm"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-gold-foreground/30 border-t-gold-foreground" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                Roles disponibles
              </span>
            </div>
          </div>

          {/* Role Badges */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              Admin
            </Badge>
            <span className="text-muted-foreground">{"·"}</span>
            <Badge variant="outline" className="text-xs font-medium">
              Regente
            </Badge>
            <span className="text-muted-foreground">{"·"}</span>
            <Badge variant="outline" className="text-xs font-medium">
              Estudiante
            </Badge>
          </div>

          {/* Demo Credentials */}
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="mb-2 text-xs font-semibold text-foreground">
              Cuentas de demostración:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Admin:</span>{" "}
                202600educadorado
              </p>
              <p>
                <span className="font-medium text-foreground">Regente:</span>{" "}
                202600educaregente
              </p>
              <p>
                <span className="font-medium text-foreground">Estudiante 2:</span>{" "}
                202601
              </p>
              <p>
                <span className="font-medium text-foreground">Estudiante 1:</span>{" "}
                202602
              </p>
              <p className="mt-1 text-muted-foreground/70 italic">
                Contraseña: cualquiera
              </p>
            </div>
          </div>
          <p className="block lg:hidden text-xs text-white/50">
            {"© 2026 Todos los derechos reservados. Desarrollado por Leonardo Ramos."}
          </p>
        </div>
      </div>
    </div>
  )
}