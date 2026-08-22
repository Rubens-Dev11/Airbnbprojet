import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatFcfa, AMENITY_LABELS, LISTING_TYPE_LABELS, type Amenity } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';

/**
 * Fiche publique d'un logement.
 *
 * Rendue côté serveur et indexable : c'est le seul canal d'acquisition gratuit
 * face à PUOL, qui est une application mobile (ADR-003). Accessible sans
 * compte.
 *
 * L'adresse exacte et le téléphone de l'hôte n'y figurent PAS — ils vivent
 * dans `listing_contacts`, dont la politique RLS les réserve aux locataires
 * dont l'avance est vérifiée (ADR-007). Cette page ne les demande même pas.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('listings')
    .select('title, price_per_night, neighborhoods(name)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (!data) return { title: 'Logement introuvable' };

  return {
    title: `${data.title} — ${data.neighborhoods?.name}, Douala`,
    description: `${data.title} à ${data.neighborhoods?.name}, Douala. ${formatFcfa(
      data.price_per_night,
    )} la nuit.`,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from('listings')
    .select(
      'id, title, description, price_per_night, listing_type, max_guests, amenities, landmark, neighborhoods(name), listing_images(storage_path, position)',
    )
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (!listing) notFound();

  const photos = [...(listing.listing_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((i) => supabase.storage.from('listing-photos').getPublicUrl(i.storage_path).data.publicUrl);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Tous les logements
      </Link>

      {photos.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {photos.map((url, i) => (
            <div
              key={url}
              className={`relative overflow-hidden rounded ${
                i === 0 ? 'aspect-[16/10] sm:col-span-2' : 'aspect-[4/3]'
              }`}
            >
              <Image
                src={url}
                alt={listing.title}
                fill
                sizes={i === 0 ? '(max-width: 640px) 100vw, 800px' : '(max-width: 640px) 100vw, 400px'}
                className="object-cover"
                // La première image est au-dessus de la ligne de flottaison :
                // la charger en priorité évite un affichage tardif sur 3G.
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-ink-900">{listing.title}</h1>
        <p className="text-ink-700">
          {LISTING_TYPE_LABELS[listing.listing_type]} · {listing.neighborhoods?.name}
          {listing.landmark ? ` · ${listing.landmark}` : ''} · {listing.max_guests} personne
          {listing.max_guests > 1 ? 's' : ''}
        </p>
        <p className="text-2xl font-semibold text-brand-700">
          {formatFcfa(listing.price_per_night)} <span className="text-base text-gray-500">/ nuit</span>
        </p>
      </header>

      {listing.description && (
        <section>
          <h2 className="mb-2 font-medium text-ink-900">Description</h2>
          <p className="whitespace-pre-wrap text-ink-700">{listing.description}</p>
        </section>
      )}

      {listing.amenities.length > 0 && (
        <section>
          <h2 className="mb-2 font-medium text-ink-900">Équipements</h2>
          <ul className="flex flex-wrap gap-2">
            {listing.amenities.map((code) => (
              <li
                key={code}
                className="rounded-full border border-gray-300 px-3 py-1 text-sm text-ink-700"
              >
                {AMENITY_LABELS[code as Amenity] ?? code}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded border border-brand-200 bg-brand-50 p-5">
        <p className="text-sm text-ink-700">
          L&apos;adresse exacte et le contact de l&apos;hôte vous sont communiqués{' '}
          <strong>après vérification de votre avance</strong>. C&apos;est ce qui protège les deux
          parties.
        </p>
        <Link
          href={`/reserver/${listing.id}`}
          className="mt-4 inline-block rounded bg-brand-700 px-6 py-3 font-medium text-white hover:bg-brand-600"
        >
          Demander à réserver
        </Link>
      </section>
    </main>
  );
}
