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
    const { estudianteId } = await request.json();
    if (!estudianteId) {
      return NextResponse.json({ error: 'estudianteId requerido' }, { status: 400 });
    }

    // 1. Buscar el usuario auth vinculado al estudiante
    const { data: usuario, error: errorUsuario } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('estudiante_id', estudianteId)
      .single();

    if (errorUsuario || !usuario) {
      return NextResponse.json(
        { error: 'No se encontró el usuario vinculado' },
        { status: 404 },
      );
    }

    // 2. Obtener datos del usuario auth para saber el email (= código)
    const { data: authUser, error: errorAuth } = await supabaseAdmin.auth.admin.getUserById(
      usuario.id,
    );
    if (errorAuth || !authUser.user) {
      return NextResponse.json({ error: 'Error al obtener usuario auth' }, { status: 500 });
    }

    // 3. Obtener datos del estudiante
    const { data: estudiante, error: errorEst } = await supabaseAdmin
      .from('estudiantes')
      .select('nombre_completo, curso, seccion')
      .eq('id', estudianteId)
      .single();

    if (errorEst || !estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    // 4. Generar y aplicar nueva contraseña
    const newPassword = generarPassword();
    const { error: errorReset } = await supabaseAdmin.auth.admin.updateUserById(usuario.id, {
      password: newPassword,
    });

    if (errorReset) {
      return NextResponse.json(
        { error: 'Error al resetear contraseña: ' + errorReset.message },
        { status: 500 },
      );
    }

    // El email tiene formato "CODIGO@colegiodorado.edu"
    const email = authUser.user.email ?? '';
    const codigo = email.replace('@colegiodorado.edu', '');

    return NextResponse.json({
      ok: true,
      credenciales: {
        nombre_completo: estudiante.nombre_completo,
        curso: estudiante.curso,
        seccion: estudiante.seccion,
        codigo,
        email,
        password: newPassword,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
