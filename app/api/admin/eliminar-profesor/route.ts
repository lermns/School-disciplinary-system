import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: Request) {
  try {
    const { profesorId } = await request.json();
    if (!profesorId) {
      return NextResponse.json({ error: 'profesorId es requerido' }, { status: 400 });
    }

    // Eliminar de auth.users → cascada a public.usuarios y profesor_cursos
    const { error } = await supabaseAdmin.auth.admin.deleteUser(profesorId);
    if (error) {
      return NextResponse.json(
        { error: 'Error al eliminar: ' + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
