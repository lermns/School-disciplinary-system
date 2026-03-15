import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    '',
  );
}

export async function POST(request: Request) {
  try {
    const { profesorId } = await request.json();
    if (!profesorId) {
      return NextResponse.json({ error: 'profesorId requerido' }, { status: 400 });
    }

    // 1. Obtener datos del usuario auth (para el email/código)
    const { data: authUser, error: errorAuth } =
      await supabaseAdmin.auth.admin.getUserById(profesorId);
    if (errorAuth || !authUser.user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Obtener nombre del profesor
    const { data: usuario, error: errorU } = await supabaseAdmin
      .from('usuarios')
      .select('nombre_completo')
      .eq('id', profesorId)
      .single();
    if (errorU || !usuario) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    // 3. Generar y aplicar nueva contraseña
    const newPassword = generarPassword();
    const { error: errorReset } = await supabaseAdmin.auth.admin.updateUserById(profesorId, {
      password: newPassword,
    });
    if (errorReset) {
      return NextResponse.json(
        { error: 'Error al resetear: ' + errorReset.message },
        { status: 500 },
      );
    }

    const email = authUser.user.email ?? '';
    const codigo = email.replace('@colegiodorado.edu', '');

    return NextResponse.json({
      ok: true,
      credenciales: {
        nombre_completo: usuario.nombre_completo,
        codigo,
        email,
        password: newPassword,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
