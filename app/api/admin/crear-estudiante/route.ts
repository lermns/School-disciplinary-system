import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    '',
  );
}

async function generarCodigo(): Promise<string> {
  const anio = new Date().getFullYear();
  const { count } = await supabaseAdmin
    .from('estudiantes')
    .select('*', { count: 'exact', head: true });
  const siguiente = (count ?? 0).toString().padStart(2, '0');
  return `${anio}${siguiente}`;
}

export async function POST(request: Request) {
  try {
    const { nombre_completo, curso, seccion, direccion } = await request.json();

    if (!nombre_completo || !curso || !seccion || !direccion) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    // 1. Crear registro en estudiantes
    const { data: estudiante, error: errorEst } = await supabaseAdmin
      .from('estudiantes')
      .insert({ nombre_completo, curso, seccion, direccion, activo: true })
      .select()
      .single();

    if (errorEst || !estudiante) {
      return NextResponse.json(
        { error: 'Error al crear estudiante: ' + errorEst?.message },
        { status: 500 },
      );
    }

    // 2. Generar credenciales
    const codigo = await generarCodigo();
    const email = `${codigo}@colegiodorado.edu`;
    const password = generarPassword();

    // 3. Crear usuario en Auth (sin metadata — lo insertamos manualmente abajo)
    const { data: authData, error: errorAuth } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (errorAuth || !authData.user) {
      // Revertir estudiante
      await supabaseAdmin.from('estudiantes').delete().eq('id', estudiante.id);
      return NextResponse.json(
        { error: 'Error al crear usuario auth: ' + errorAuth?.message },
        { status: 500 },
      );
    }

    // 4. Insertar perfil en public.usuarios manualmente
    const { error: errorUsuario } = await supabaseAdmin.from('usuarios').insert({
      id: authData.user.id,
      nombre_completo,
      rol: 'estudiante',
      estudiante_id: estudiante.id,
    });

    if (errorUsuario) {
      // Revertir ambos
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('estudiantes').delete().eq('id', estudiante.id);
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + errorUsuario.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      estudiante,
      credenciales: { codigo, email, password, nombre_completo, curso, seccion },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
