import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { formatFcfa, type BookingStatus } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';

export const metadata = { title: 'Ma réservation' };

/** Libellés et explications, par état. Ce que la personne doit comprendre. */
const ETATS: Record<BookingStatus, { titre: string; explication: string }> = {
  PENDING: {
    titre: 'En attente de réponse',
    explication:
      "L'hôte a 24 heures pour accepter ou refuser. Vous ne payez rien tant qu'il n'a pas accepté. Passé ce délai, la demande expire automatiquement.",
  },
  ACCEPTED: {
    titre: 'Acceptée — avance à payer',
    explication:
      "L'hôte a accepté. Payez l'avance pour bloquer les dates et obtenir ses coordonnées. Les dates ne vous sont pas réservées tant que l'avance n'est pas vérifiée.",
  },
  DEPOSIT_DECLARED: {
    titre: 'Avance déclarée — vérification en cours',
    explication:
      "Nous vérifions votre paiement à la main. C'est fait sous 24 heures ouvrées. Les coordonnées de l'hôte vous seront communiquées à ce moment-là.",
  },
  CONFIRMED: {
    titre: 'Confirmée',
    explication:
      "Vos dates sont bloquées. Le solde se règle directement à l'hôte à votre arrivée.",
  },
  COMPLETED: { titre: 'Terminée', explication: 'Ce séjour est passé.' },
  REJECTED: {
    titre: 'Refusée par l’hôte',
    explication: "Vous n'avez rien payé. Vous pouvez chercher un autre logement.",
  },
  EXPIRED: {
    titre: 'Expirée',
    explication:
      "L'hôte n'a pas répondu dans les 24 heures. Vous n'avez rien payé. Les dates sont de nouveau libres.",
  },
  CANCELLED: { titre: 'Annulée', explication: 'Cette demande a été annulée.' },
};

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouvelle?: string }>;
}) {
  const [{ id }, { nouvelle }] = await Promise.all([params, searchParams]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/connexion?suite=${encodeURIComponent(`/reservations/${id}`)}`);

  // RLS limite déjà la lecture aux personnes concernées : si la ligne
  // n'appartient pas à cet utilisateur, la requête ne renvoie rien.
  const { data: booking } = await supabase
    .from('bookings')
    .select(
      'id, check_in, check_out, nights, total_amount, deposit_amount, status, message, expires_at, listings(id, title, neighborhoods(name))',
    )
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  const etat = ETATS[booking.status];

  // Les coordonnées ne sont lisibles qu'après vérification de l'avance —
  // c'est la politique RLS qui décide, pas cette page. On tente la lecture :
  // si elle ne renvoie rien, c'est que le droit n'est pas acquis.
  const { data: contact } = await supabase
    .from('listing_contacts')
    .select('exact_address, contact_phone, access_notes')
    .eq('listing_id', booking.listings!.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm text-brand-700 hover:underline">
        ← Accueil
      </Link>

      {nouvelle === '1' && (
        <p role="status" className="rounded border border-brand-300 bg-brand-50 p-4 text-sm text-brand-900">
          <strong>Demande envoyée.</strong> L&apos;hôte en est informé.
        </p>
      )}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-ink-900">{booking.listings?.title}</h1>
        <p className="text-sm text-gray-500">
          {booking.listings?.neighborhoods?.name} · du {booking.check_in} au {booking.check_out} ·{' '}
          {booking.nights} nuit{booking.nights > 1 ? 's' : ''}
        </p>
      </header>

      <section className="rounded border border-brand-200 bg-brand-50 p-5">
        <h2 className="font-medium text-brand-900">{etat.titre}</h2>
        <p className="mt-2 text-sm text-ink-700">{etat.explication}</p>
      </section>

      <section className="rounded border border-gray-300 bg-white p-5">
        <h2 className="mb-3 font-medium text-ink-900">Montants</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-700">Total du séjour</dt>
            <dd className="text-ink-900">{formatFcfa(booking.total_amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium text-ink-900">Avance</dt>
            <dd className="font-medium text-brand-700">{formatFcfa(booking.deposit_amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-700">Solde, à l’arrivée</dt>
            <dd className="text-ink-700">
              {formatFcfa(booking.total_amount - booking.deposit_amount)}
            </dd>
          </div>
        </dl>
      </section>

      {contact ? (
        <section className="rounded border border-brand-700 bg-white p-5">
          <h2 className="mb-2 font-medium text-brand-900">Coordonnées de l&apos;hôte</h2>
          <p className="text-sm text-ink-900">{contact.exact_address}</p>
          <p className="mt-1 text-sm text-ink-900">{contact.contact_phone}</p>
          {contact.access_notes && (
            <p className="mt-2 text-sm text-ink-700">{contact.access_notes}</p>
          )}
        </section>
      ) : (
        <section className="rounded border border-gray-300 bg-gray-100 p-5">
          <p className="text-sm text-ink-700">
            L&apos;adresse exacte et le téléphone de l&apos;hôte s&apos;afficheront ici{' '}
            <strong>dès que votre avance sera vérifiée</strong>.
          </p>
        </section>
      )}
    </main>
  );
}
