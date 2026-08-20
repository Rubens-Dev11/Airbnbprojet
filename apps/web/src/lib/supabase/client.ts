'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@app/shared';

/**
 * Client Supabase côté navigateur.
 *
 * Utilisé uniquement pour l'authentification — connexion, déconnexion. Les
 * lectures de données passent par le serveur : la latence mesurée depuis le
 * Cameroun est d'environ 250 ms par aller-retour vers la base, ce qui rend
 * l'appel direct depuis l'appareil coûteux dès qu'il faut plus d'une requête
 * (ADR-004).
 *
 * La clé « anon » est publique par conception : c'est RLS qui protège les
 * données, pas le secret de cette clé.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
