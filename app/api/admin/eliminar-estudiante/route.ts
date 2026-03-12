import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: Request) {
  try {
    const { estudianteId } = await request.json();

    if (!estudianteId) {
      return NextResponse.json({ error: 'estudianteId es requerido' }, { status: 400 });
    }

    // 1. Buscar el usuario de auth vinculado al estudiante
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

    // 2. Eliminar de auth.users → cascada a public.usuarios automáticamente
    const { error: errorAuth } = await supabaseAdmin.auth.admin.deleteUser(usuario.id);

    if (errorAuth) {
      return NextResponse.json(
        { error: 'Error al eliminar usuario auth: ' + errorAuth.message },
        { status: 500 },
      );
    }

    // 3. Eliminar estudiante → cascada a infracciones automáticamente
    const { error: errorEst } = await supabaseAdmin
      .from('estudiantes')
      .delete()
      .eq('id', estudianteId);

    if (errorEst) {
      return NextResponse.json(
        { error: 'Error al eliminar estudiante: ' + errorEst.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
