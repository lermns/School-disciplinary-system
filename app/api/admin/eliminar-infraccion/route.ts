import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: Request) {
  try {
    const { infraccionId } = await request.json();
    if (!infraccionId) {
      return NextResponse.json({ error: 'infraccionId es requerido' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('infracciones').delete().eq('id', infraccionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
