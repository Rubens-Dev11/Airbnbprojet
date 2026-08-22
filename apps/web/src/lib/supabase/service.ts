import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@app/shared';

/**
 * Client à privilèges de service — CONTOURNE RLS.
 *
 * Réservé à un seul usage aujourd'hui : journaliser les conversations de
 * l'agent. Un visiteur non connecté doit pouvoir dialoguer (PRD US-001), or
 * aucune politique ne lui permet d'écrire dans `chat_sessions`. C'est le
 * serveur qui écrit pour lui.
 *
 * ⚠ Ne jamais utiliser ce client pour lire des données destinées à un
 * utilisateur : RLS étant contourné, une erreur de filtrage exposerait tout.
 * Les recherches de l'agent passent par le client de session, pas par
 * celui-ci.
 *
 * ⚠ SUPABASE_SERVICE_ROLE_KEY n'est PAS préfixée par NEXT_PUBLIC_ : elle ne
 * doit jamais atteindre le navigateur.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquante. Voir .env.example.",
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
