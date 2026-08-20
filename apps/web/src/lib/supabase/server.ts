import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@app/shared';

/**
 * Client Supabase côté serveur, porteur de la session de l'utilisateur.
 *
 * `cookies()` est ASYNCHRONE depuis Next.js 15 — vérifié dans les guides
 * embarqués de Next 16 (`node_modules/next/dist/docs`), pas supposé.
 *
 * Toutes les requêtes passent par ce client, donc sous RLS : c'est ce qui fait
 * qu'une route oubliée ne peut pas contourner une politique (ADR-004).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Écriture impossible depuis un Server Component : c'est attendu.
            // Le rafraîchissement de session est fait par `src/proxy.ts`.
          }
        },
      },
    },
  );
}

/**
 * Échoue au démarrage plutôt qu'à la première requête.
 *
 * Une variable manquante produit sinon un client Supabase construit avec
 * `undefined`, qui échoue plus loin avec un message sans rapport — et on
 * cherche le bug au mauvais endroit.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example à la racine.`,
    );
  }
  return value;
}
