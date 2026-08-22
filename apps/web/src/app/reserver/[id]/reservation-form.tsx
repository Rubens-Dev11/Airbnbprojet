'use client';

import { useActionState, useState } from 'react';
import { formatFcfa } from '@app/shared';
import { creerDemande, type ReservationResult } from './actions.ts';

/**
 * Formulaire de demande de réservation.
 *
 * Le récapitulatif se recalcule à l'écran pendant la saisie, mais il n'est
 * qu'indicatif : les montants qui font foi sont recalculés côté serveur à
 * partir du prix en base. Rien de ce formulaire n'est cru sur parole.
 */
export function ReservationForm({
  listingId,
  pricePerNight,
  tauxAvancePourcent,
  arriveeDefaut,
  departDefaut,
}: {
  listingId: string;
  pricePerNight: number;
  tauxAvancePourcent: number;
  arriveeDefaut: string;
  departDefaut: string;
}) {
  const [arrivee, setArrivee] = useState(arriveeDefaut);
  const [depart, setDepart] = useState(departDefaut);
  const [state, action, pending] = useActionState<ReservationResult | null, FormData>(
    creerDemande,
    null,
  );

  const nuits = compterNuits(arrivee, depart);
  const total = nuits ? nuits * pricePerNight : null;
  const avance = total ? Math.min(total, Math.ceil((total * tauxAvancePourcent) / 100 / 100) * 100) : null;

  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="listing_id" value={listingId} />

      {state?.ok === false && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink-900">Arrivée</span>
          <input
            type="date"
            name="arrivee"
            required
            min={aujourdhui}
            value={arrivee}
            onChange={(e) => setArrivee(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink-900">Départ</span>
          <input
            type="date"
            name="depart"
            required
            min={arrivee || aujourdhui}
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink-900">Message à l&apos;hôte</span>
        <span className="text-xs text-gray-500">Facultatif — motif du séjour, heure d&apos;arrivée…</span>
        <textarea name="message" rows={3} className={INPUT} />
      </label>

      <section className="rounded border border-gray-300 bg-white p-4">
        <h2 className="mb-3 font-medium text-ink-900">Récapitulatif</h2>
        {nuits === null ? (
          <p className="text-sm text-gray-500">Choisissez vos dates pour voir le montant.</p>
        ) : (
          <dl className="flex flex-col gap-2 text-sm">
            <Ligne libelle={`${formatFcfa(pricePerNight)} × ${nuits} nuit${nuits > 1 ? 's' : ''}`}>
              {formatFcfa(total!)}
            </Ligne>
            <Ligne libelle={`Avance à payer maintenant (${tauxAvancePourcent} %)`} fort>
              {formatFcfa(avance!)}
            </Ligne>
            <Ligne libelle="Solde, à régler à l’hôte à votre arrivée">
              {formatFcfa(total! - avance!)}
            </Ligne>
          </dl>
        )}
      </section>

      <p className="text-sm text-ink-700">
        Votre demande part à l&apos;hôte, qui a <strong>24 heures</strong> pour répondre. Vous ne
        payez rien tant qu&apos;il n&apos;a pas accepté. L&apos;avance est demandée seulement
        ensuite, et c&apos;est elle qui bloque les dates et vous donne les coordonnées.
      </p>

      <button
        type="submit"
        disabled={pending || nuits === null}
        className="self-start rounded bg-brand-700 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </form>
  );
}

const INPUT =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-700';

function Ligne({
  libelle,
  fort,
  children,
}: {
  libelle: string;
  fort?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={fort ? 'font-medium text-ink-900' : 'text-ink-700'}>{libelle}</dt>
      <dd className={fort ? 'font-medium text-brand-700' : 'text-ink-700'}>{children}</dd>
    </div>
  );
}

function compterNuits(a: string, d: string): number | null {
  if (!a || !d) return null;
  const n = Math.round((Date.parse(d) - Date.parse(a)) / 86_400_000);
  return Number.isFinite(n) && n >= 1 ? n : null;
}
