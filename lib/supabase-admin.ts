// lib/supabase-admin.ts  ← solo se usa en /api routes, NUNCA en el cliente
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // sin NEXT_PUBLIC_ a propósito
);
