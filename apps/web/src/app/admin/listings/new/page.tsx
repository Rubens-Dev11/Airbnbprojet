import Link from 'next/link';
import { requireAdmin } from '@/lib/auth.ts';
import { createClient } from '@/lib/supabase/server.ts';
import { ListingForm } from './listing-form.tsx';

export const metadata = { title: 'Nouvelle annonce — administration' };

export default async function NewListingPage() {
  // Garde d'expérience utilisateur. La sécurité réelle est dans RLS et dans
  // le contrôle refait à l'intérieur de la Server Action.
  await requireAdmin();

  const supabase = await createClient();

  const [{ data: neighborhoods }, { data: owners }] = await Promise.all([
    supabase.from('neighborhoods').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'OWNER').order('full_name'),
  ]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Link href="/admin/listings" className="text-sm text-brand-700 hover:underline">
          ← Toutes les annonces
        </Link>
        <h1 className="text-2xl font-semibold text-ink-900">Nouvelle annonce</h1>
        <p className="text-sm text-gray-500">
          Saisie par l&apos;équipe pendant l&apos;amorçage du catalogue. L&apos;auto-publication par
          le propriétaire viendra en Phase 2.
        </p>
      </div>

      {owners && owners.length === 0 ? (
        <p role="alert" className="rounded border border-gray-300 bg-gray-100 p-4 text-sm text-ink-700">
          Aucun propriétaire enregistré. Une annonce doit être rattachée à un propriétaire : il faut
          d&apos;abord en créer un.
        </p>
      ) : (
        <ListingForm
          neighborhoods={(neighborhoods ?? []).map((n) => ({ id: n.id, label: n.name }))}
          owners={(owners ?? []).map((o) => ({ id: o.id, label: o.full_name }))}
        />
      )}
    </main>
  );
}
