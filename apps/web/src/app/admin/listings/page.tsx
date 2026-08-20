import Link from 'next/link';
import { formatFcfa, LISTING_TYPE_LABELS } from '@app/shared';
import { requireAdmin } from '@/lib/auth.ts';
import { createClient } from '@/lib/supabase/server.ts';

export const metadata = { title: 'Annonces — administration' };

export default async function AdminListingsPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, price_per_night, listing_type, is_active, neighborhoods(name)')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-900">Annonces</h1>
        <Link
          href="/admin/listings/new"
          className="rounded bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Nouvelle annonce
        </Link>
      </div>

      {/* On affiche l'erreur réelle plutôt qu'une liste vide : une liste vide
          et une requête en échec se ressemblent à l'écran, et se diagnostiquent
          très différemment. */}
      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          Lecture impossible : {error.message}
        </p>
      )}

      {!error && listings?.length === 0 && (
        <p className="rounded border border-gray-300 bg-gray-100 p-6 text-sm text-ink-700">
          Aucune annonce. Le PRD fixe un objectif de <strong>30 annonces</strong> en ligne à
          l&apos;ouverture (critère S4) : une place de marché vide ne convertit personne.
        </p>
      )}

      {listings && listings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-left text-ink-700">
                <th className="py-2 pr-4 font-medium">Titre</th>
                <th className="py-2 pr-4 font-medium">Quartier</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Prix / nuit</th>
                <th className="py-2 font-medium">État</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-brand-50">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/listings/${l.id}`} className="text-brand-700 hover:underline">
                      {l.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink-700">{l.neighborhoods?.name ?? '—'}</td>
                  <td className="py-3 pr-4 text-ink-700">{LISTING_TYPE_LABELS[l.listing_type]}</td>
                  <td className="py-3 pr-4 text-ink-900">{formatFcfa(l.price_per_night)}</td>
                  <td className="py-3">
                    {l.is_active ? (
                      <span className="text-brand-700">Publiée</span>
                    ) : (
                      <span className="text-gray-500">Brouillon</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
