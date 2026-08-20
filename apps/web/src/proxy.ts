import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rafraîchissement de la session Supabase à chaque requête.
 *
 * ⚠ En Next.js 16, ce fichier s'appelle `proxy.ts` et NON `middleware.ts`.
 * Le renommage est documenté dans les guides embarqués :
 * « Starting with Next.js 16, Middleware is now called Proxy ». La quasi-
 * totalité des exemples Supabase en ligne parlent encore de `middleware.ts` —
 * les recopier ici ne produirait aucun effet, sans la moindre erreur visible.
 *
 * ⚠ Ce fichier N'EST PAS une barrière d'autorisation. Les guides Next le
 * disent explicitement : le proxy sert aux contrôles optimistes, jamais à la
 * gestion de session ni à l'autorisation. L'autorisation réelle vit dans les
 * politiques RLS et dans `requireAdmin()`.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sans configuration, on laisse passer : l'erreur explicite viendra du
  // client serveur, avec le nom de la variable manquante.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Provoque le rafraîchissement du jeton si nécessaire.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
