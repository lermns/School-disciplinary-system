import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(request: Request) {
  try {
    const { profesorId, nombre_completo } = await request.json();

    if (!profesorId) {
      return NextResponse.json({ error: 'profesorId es requerido' }, { status: 400 });
    }
    if (!nombre_completo?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ nombre_completo: nombre_completo.trim() })
      .eq('id', profesorId);

    if (error) {
      return NextResponse.json(
        { error: 'Error al actualizar: ' + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
