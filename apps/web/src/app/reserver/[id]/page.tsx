import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatFcfa, LISTING_TYPE_LABELS } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';
import { tauxAvancePourcent } from '@/lib/pricing.ts';
import { ReservationForm } from './reservation-form.tsx';

export const metadata = { title: 'Demander à réserver' };

export default async function ReserverPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ arrivee?: string; depart?: string }>;
}) {
  const [{ id }, { arrivee, depart }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, price_per_night, listing_type, neighborhoods(name)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (!listing) notFound();

  // Les dates viennent de l'agent quand il a préparé la demande — le parcours
  // conversationnel ne doit pas obliger à les ressaisir.
  const valide = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '');

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Link href={`/logement/${listing.id}`} className="text-sm text-brand-700 hover:underline">
          ← Revenir au logement
        </Link>
        <h1 className="text-2xl font-semibold text-ink-900">Demander à réserver</h1>
        <p className="text-sm text-gray-500">
          {listing.title} · {LISTING_TYPE_LABELS[listing.listing_type]} ·{' '}
          {listing.neighborhoods?.name} · {formatFcfa(listing.price_per_night)} / nuit
        </p>
      </div>

      <ReservationForm
        listingId={listing.id}
        pricePerNight={listing.price_per_night}
        tauxAvancePourcent={tauxAvancePourcent()}
        arriveeDefaut={valide(arrivee)}
        departDefaut={valide(depart)}
      />
    </main>
  );
}
