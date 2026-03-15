import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE() {
  try {
    // 1. Obtener todos los usuarios con rol 'estudiante'
    const { data: usuarios, error: errU } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('rol', 'estudiante');

    if (errU) {
      return NextResponse.json(
        { error: 'Error al obtener usuarios: ' + errU.message },
        { status: 500 },
      );
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ ok: true, eliminados: 0 });
    }

    // 2. Eliminar de auth.users en lotes (cascada elimina public.usuarios)
    let eliminados = 0;
    const errores: string[] = [];

    for (const usuario of usuarios) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(usuario.id);
      if (error) {
        errores.push(`${usuario.id}: ${error.message}`);
      } else {
        eliminados++;
      }
    }

    // 3. Eliminar todos los estudiantes que queden (por si algún usuario
    //    no tenía auth pero sí registro en estudiantes)
    await supabaseAdmin
      .from('estudiantes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    return NextResponse.json({
      ok: true,
      eliminados,
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
