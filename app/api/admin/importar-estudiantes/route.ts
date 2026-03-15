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
    const { estudiantes } = await request.json();
    // estudiantes = [{ nombre_completo, curso, seccion }]

    if (!Array.isArray(estudiantes) || estudiantes.length === 0) {
      return NextResponse.json({ error: 'Lista de estudiantes vacía' }, { status: 400 });
    }

    const resultados: Array<{
      nombre_completo: string;
      curso: string;
      seccion: string;
      codigo: string;
      email: string;
      password: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const est of estudiantes) {
      const { nombre_completo, curso, seccion } = est;

      if (!nombre_completo?.trim() || !curso || !seccion) {
        resultados.push({
          nombre_completo,
          curso,
          seccion,
          codigo: '',
          email: '',
          password: '',
          ok: false,
          error: 'Datos incompletos',
        });
        continue;
      }

      try {
        // 1. Crear registro en estudiantes
        const { data: estudiante, error: errorEst } = await supabaseAdmin
          .from('estudiantes')
          .insert({
            nombre_completo: nombre_completo.trim(),
            curso,
            seccion,
            direccion: '',
            activo: true,
          })
          .select()
          .single();

        if (errorEst || !estudiante) {
          resultados.push({
            nombre_completo,
            curso,
            seccion,
            codigo: '',
            email: '',
            password: '',
            ok: false,
            error: errorEst?.message ?? 'Error al crear estudiante',
          });
          continue;
        }

        // 2. Generar credenciales
        const codigo = await generarCodigo();
        const email = `${codigo}@colegiodorado.edu`;
        const password = generarPassword();

        // 3. Crear usuario en Auth
        const { data: authData, error: errorAuth } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (errorAuth || !authData.user) {
          await supabaseAdmin.from('estudiantes').delete().eq('id', estudiante.id);
          resultados.push({
            nombre_completo,
            curso,
            seccion,
            codigo,
            email,
            password,
            ok: false,
            error: errorAuth?.message ?? 'Error auth',
          });
          continue;
        }

        // 4. Insertar perfil en public.usuarios
        const { error: errorUsuario } = await supabaseAdmin.from('usuarios').insert({
          id: authData.user.id,
          nombre_completo: nombre_completo.trim(),
          rol: 'estudiante',
          estudiante_id: estudiante.id,
        });

        if (errorUsuario) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          await supabaseAdmin.from('estudiantes').delete().eq('id', estudiante.id);
          resultados.push({
            nombre_completo,
            curso,
            seccion,
            codigo,
            email,
            password,
            ok: false,
            error: errorUsuario.message,
          });
          continue;
        }

        resultados.push({
          nombre_completo: nombre_completo.trim(),
          curso,
          seccion,
          codigo,
          email,
          password,
          ok: true,
        });
      } catch (e: any) {
        resultados.push({
          nombre_completo,
          curso,
          seccion,
          codigo: '',
          email: '',
          password: '',
          ok: false,
          error: e.message,
        });
      }
    }

    const exitosos = resultados.filter((r) => r.ok).length;
    return NextResponse.json({ ok: true, resultados, exitosos, total: resultados.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Error desconocido' }, { status: 500 });
  }
}
