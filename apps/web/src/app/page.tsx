import Link from 'next/link';
import Image from 'next/image';
import { formatFcfa } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';
import { getCurrentProfile } from '@/lib/auth.ts';
import { AssistantPanel } from './assistant-panel.tsx';

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
      // Les photos font partie de la carte, pas d'un détail : le CDC §1
      // identifie « photos inexistantes ou trompeuses » comme le problème
      // central du marché. Une carte sans image ne se distingue pas d'une
      // annonce WhatsApp.
      .select(
        'id, title, price_per_night, landmark, is_demo, neighborhoods(name), listing_images(storage_path, position)',
      )
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  /** Photo de couverture : celle de position la plus basse. */
  function coverUrl(images: { storage_path: string; position: number }[] | null): string | null {
    if (!images || images.length === 0) return null;
    const cover = [...images].sort((a, b) => a.position - b.position)[0];
    if (!cover) return null;
    return supabase.storage.from('listing-photos').getPublicUrl(cover.storage_path).data.publicUrl;
  }

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

      {/* Avertissement impossible à manquer dès qu'une annonce inventée est
          publiée. Les règles de travail l'exigent : « ne jamais laisser de
          données de démonstration se faire passer pour des données réelles ».
          Une bannière discrète ne suffirait pas — elle doit gêner. */}
      {listings?.some((l) => l.is_demo) && (
        <aside
          role="status"
          className="rounded border-2 border-dashed border-accent-500 bg-white p-4 text-sm"
        >
          <p className="font-medium text-accent-500">Données de démonstration</p>
          <p className="mt-1 text-ink-700">
            Certaines annonces ci-dessous sont <strong>inventées</strong> et servent uniquement à
            développer et à mesurer l&apos;assistant. Elles ne correspondent à aucun logement réel
            et ne doivent jamais être proposées à un utilisateur.
          </p>
          <p className="mt-1 text-gray-500">
            Purge&nbsp;: <code>pnpm seed:demo -- --purge</code>
          </p>
        </aside>
      )}

      {/* L'assistant est placé AVANT le catalogue, délibérément : c'est le
          canal de réservation principal (ADR-005), pas un accessoire. Le
          reléguer plus bas contredirait le positionnement du produit. */}
      <AssistantPanel />

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
          {listings.map((l) => {
            const cover = coverUrl(l.listing_images);
            return (
              <article
                key={l.id}
                className="overflow-hidden rounded border border-gray-300 bg-white"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={l.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    // Ne devrait pas arriver : la publication est refusée sans
                    // photo. Si ce cas s'affiche, c'est que la règle a été
                    // contournée — mieux vaut le voir qu'un cadre vide muet.
                    <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                      Aucune photo
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-medium text-ink-900">{l.title}</h2>
                  <p className="text-sm text-gray-500">
                    {l.neighborhoods?.name}
                    {l.landmark ? ` — ${l.landmark}` : ''}
                  </p>
                  <p className="mt-2 font-medium text-brand-700">
                    {formatFcfa(l.price_per_night)} <span className="text-gray-500">/ nuit</span>
                  </p>
                </div>
              </article>
            );
          })}
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
