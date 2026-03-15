import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    '',
  );
}

async function generarCodigoProfesor(): Promise<string> {
  const { count } = await supabaseAdmin
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'profesor');
  const siguiente = ((count ?? 0) + 1).toString().padStart(3, '0');
  return `prof${siguiente}`;
}

export async function POST(request: Request) {
  try {
    const { nombre_completo } = await request.json();

    if (!nombre_completo?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    // 1. Generar credenciales
    const codigo = await generarCodigoProfesor();
    const email = `${codigo}@colegiodorado.edu`;
    const password = generarPassword();

    // 2. Crear usuario en Auth
    const { data: authData, error: errorAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (errorAuth || !authData.user) {
      return NextResponse.json(
        { error: 'Error al crear usuario auth: ' + errorAuth?.message },
        { status: 500 },
      );
    }

    // 3. Insertar perfil en public.usuarios
    const { error: errorUsuario } = await supabaseAdmin.from('usuarios').insert({
      id: authData.user.id,
      nombre_completo: nombre_completo.trim(),
      rol: 'profesor',
    });
    if (errorUsuario) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + errorUsuario.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      credenciales: { codigo, email, password, nombre_completo: nombre_completo.trim() },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
