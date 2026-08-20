import Link from 'next/link';
import { formatFcfa } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';
import { getCurrentProfile } from '@/lib/auth.ts';

export const metadata = {
  title: 'Chambres meublées à Douala',
  description:
    'Trouver et réserver une chambre meublée à Douala, en décrivant simplement ce que vous cherchez.',
};

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  // Lectures en tant que visiteur : elles passent par les politiques RLS.
  // Si `listings` renvoyait des annonces inactives ici, la politique serait
  // cassée — cette page est donc aussi un témoin permanent.
  const [{ count: neighborhoodCount }, { data: listings, error }] = await Promise.all([
    supabase.from('neighborhoods').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('listings')
      .select('id, title, price_per_night, landmark, neighborhoods(name)')
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium tracking-wide text-accent-500 uppercase">
          Douala Stays — nom de travail
        </p>
        <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">
          Chambres meublées à Douala
        </h1>
        <p className="max-w-2xl text-ink-700">
          Décrivez ce que vous cherchez en une phrase, l&apos;assistant s&apos;occupe du reste.
          Bientôt&nbsp;: <em>« un studio climatisé à Akwa, moins de 25 000 la nuit, du 12 au 15 »</em>.
        </p>
      </header>

      <section className="flex flex-wrap gap-4">
        <Stat label="Quartiers couverts" value={String(neighborhoodCount ?? 0)} />
        <Stat label="Annonces publiées" value={String(listings?.length ?? 0)} />
      </section>

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          Lecture des annonces impossible : {error.message}
        </p>
      )}

      {!error && listings?.length === 0 && (
        <section className="rounded border border-gray-300 bg-white p-6">
          <h2 className="font-medium text-ink-900">Le catalogue est vide</h2>
          <p className="mt-2 text-sm text-ink-700">
            C&apos;est attendu&nbsp;: le référentiel des quartiers est en place, les annonces
            restent à saisir. Objectif fixé par le PRD avant ouverture&nbsp;:{' '}
            <strong>30 annonces</strong>. Une place de marché vide ne convertit personne.
          </p>
        </section>
      )}

      {listings && listings.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {listings.map((l) => (
            <article key={l.id} className="rounded border border-gray-300 bg-white p-4">
              <h2 className="font-medium text-ink-900">{l.title}</h2>
              <p className="text-sm text-gray-500">
                {l.neighborhoods?.name}
                {l.landmark ? ` — ${l.landmark}` : ''}
              </p>
              <p className="mt-2 font-medium text-brand-700">
                {formatFcfa(l.price_per_night)} <span className="text-gray-500">/ nuit</span>
              </p>
            </article>
          ))}
        </section>
      )}

      <footer className="flex flex-wrap items-center gap-4 border-t border-gray-300 pt-6">
        {profile?.role === 'ADMIN' ? (
          <Link
            href="/admin/listings"
            className="rounded bg-brand-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Administration
          </Link>
        ) : (
          <Link href="/connexion?suite=/admin/listings" className="text-sm text-brand-700 hover:underline">
            Connexion
          </Link>
        )}
        {profile && (
          <span className="text-sm text-gray-500">
            Connecté&nbsp;: {profile.full_name} ({profile.role})
          </span>
        )}
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-brand-200 bg-brand-50 px-5 py-4">
      <p className="text-2xl font-semibold text-brand-900">{value}</p>
      <p className="text-sm text-ink-700">{label}</p>
    </div>
  );
}
