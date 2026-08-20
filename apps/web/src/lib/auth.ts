import { redirect } from 'next/navigation';
import type { Profile } from '@app/shared';
import { createClient } from './supabase/server.ts';

/**
 * Exige une session ADMIN. Redirige sinon.
 *
 * ⚠ À appeler DANS chaque Server Action, pas seulement dans la page.
 * Les guides de Next.js 16 sont explicites : « Server Functions are reachable
 * via direct POST requests, not just through your application's UI. Always
 * verify authentication and authorization inside every Server Function. »
 * Protéger la page seule laisserait l'action ouverte à un POST direct.
 *
 * Cette fonction est une commodité d'expérience — elle évite d'afficher un
 * écran vide. Elle n'est PAS la sécurité : celle-ci est dans les politiques
 * RLS, qui s'appliquent même si ce contrôle est oublié (ADR-004).
 */
export async function requireAdmin(): Promise<Profile> {
  const supabase = await createClient();

  // getUser() valide le jeton auprès du serveur d'authentification.
  // getSession() se contente de lire le cookie, qui est manipulable côté
  // client : ne jamais s'en servir pour décider d'une autorisation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/connexion?suite=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'ADMIN') redirect('/');

  return profile;
}

/** Profil courant, ou null. Ne redirige pas. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data ?? null;
}
