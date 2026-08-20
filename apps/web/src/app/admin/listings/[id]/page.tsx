import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatFcfa, LISTING_TYPE_LABELS } from '@app/shared';
import { requireAdmin } from '@/lib/auth.ts';
import { createClient } from '@/lib/supabase/server.ts';
import { ListingAdminPanel, type PhotoView } from './listing-admin-panel.tsx';

export const metadata = { title: 'Annonce — administration' };

/** `params` est une promesse depuis Next.js 15. */
export default async function ListingAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouvelle?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { nouvelle }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, price_per_night, listing_type, is_active, landmark, neighborhoods(name)')
    .eq('id', id)
    .single();

  if (!listing) notFound();

  const { data: images } = await supabase
    .from('listing_images')
    .select('id, storage_path, position')
    .eq('listing_id', id)
    .order('position');

  const photos: PhotoView[] = (images ?? []).map((image) => ({
    id: image.id,
    position: image.position,
    url: supabase.storage.from('listing-photos').getPublicUrl(image.storage_path).data.publicUrl,
  }));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/listings" className="text-sm text-brand-700 hover:underline">
          ← Toutes les annonces
        </Link>
        <h1 className="text-2xl font-semibold text-ink-900">{listing.title}</h1>
        <p className="text-sm text-gray-500">
          {listing.neighborhoods?.name} · {LISTING_TYPE_LABELS[listing.listing_type]} ·{' '}
          {formatFcfa(listing.price_per_night)} / nuit
          {listing.landmark ? ` · ${listing.landmark}` : ''}
        </p>
      </div>

      {nouvelle === '1' && (
        <p role="status" className="rounded border border-brand-300 bg-brand-50 p-4 text-sm text-brand-900">
          <strong>Annonce enregistrée.</strong> Elle est en brouillon et n&apos;est visible de
          personne. Ajoutez au moins une photo ci-dessous, puis publiez-la — sans photo, la
          publication est refusée.
        </p>
      )}

      <ListingAdminPanel listingId={listing.id} isActive={listing.is_active} photos={photos} />
    </main>
  );
}
