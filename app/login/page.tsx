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
  const { login, isLoading, user, isInitialized } = useAuth()

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

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/background_mantain.png)" }}
        />

    </div>
  )
}