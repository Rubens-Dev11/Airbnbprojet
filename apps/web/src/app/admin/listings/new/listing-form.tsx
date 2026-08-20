'use client';

import { useActionState } from 'react';
import { AMENITIES, AMENITY_LABELS, LISTING_TYPE_LABELS, type ListingType } from '@app/shared';
import { createListing, type ActionResult } from '../actions.ts';

type Option = { id: string; label: string };

/**
 * Formulaire de saisie d'une annonce.
 *
 * Volontairement dépouillé. Il ne sert qu'à remplir la base pendant
 * l'amorçage (PRD §8, Phase 0) : le soin visuel n'a de valeur qu'après le
 * go/no-go de l'agent. Le style suit néanmoins les jetons d'ADR-006 — aucune
 * couleur n'est écrite en dur, y compris ici.
 */
export function ListingForm({
  neighborhoods,
  owners,
}: {
  neighborhoods: Option[];
  owners: Option[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createListing,
    null,
  );

  const listingTypes = Object.keys(LISTING_TYPE_LABELS) as ListingType[];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-700">
        <li className="rounded bg-brand-700 px-3 py-1 font-medium text-white">
          1. Décrire le logement
        </li>
        <span className="text-gray-500">→</span>
        <li className="rounded border border-gray-300 px-3 py-1">2. Ajouter les photos</li>
        <span className="text-gray-500">→</span>
        <li className="rounded border border-gray-300 px-3 py-1">3. Publier</li>
      </ol>
      <p className="-mt-3 text-sm text-gray-500">
        Les photos s&apos;ajoutent à l&apos;étape suivante&nbsp;: elles doivent être rattachées à
        une annonce, qui n&apos;existe qu&apos;une fois enregistrée. Vous y serez conduit
        automatiquement.
      </p>

      {state?.ok === false && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <Field label="Titre de l'annonce" hint="Ce que verra le locataire en premier">
        <input name="title" required maxLength={200} className={INPUT} placeholder="Studio meublé climatisé" />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Quartier">
          <select name="neighborhood_id" required className={INPUT} defaultValue="">
            <option value="" disabled>Choisir…</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Propriétaire">
          <select name="owner_id" required className={INPUT} defaultValue="">
            <option value="" disabled>Choisir…</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Type de logement">
          <select name="listing_type" required className={INPUT} defaultValue="ROOM">
            {listingTypes.map((t) => (
              <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

        <Field label="Prix par nuit (FCFA)" hint="Nombre entier — le FCFA n'a pas de centimes">
          <input name="price_per_night" type="number" min={1} step={1} required className={INPUT} placeholder="16500" />
        </Field>

        <Field label="Nombre de personnes">
          <input name="max_guests" type="number" min={1} step={1} defaultValue={2} className={INPUT} />
        </Field>

        <Field label="Repère public" hint="Visible de tous. PAS l'adresse exacte.">
          <input name="landmark" maxLength={200} className={INPUT} placeholder="près du carrefour Andem" />
        </Field>
      </div>

      <Field label="Description">
        <textarea name="description" rows={5} className={INPUT} placeholder="Chambre confortable pour deux personnes…" />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink-900">Équipements</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" name="amenities" value={a} className="accent-brand-700" />
              {AMENITY_LABELS[a]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded border border-brand-200 bg-brand-50 p-4">
        <legend className="px-1 text-sm font-medium text-brand-900">
          Coordonnées exactes — jamais publiques
        </legend>
        <p className="text-sm text-ink-700">
          Ces informations ne sont révélées au locataire qu'<strong>après vérification de son
          avance</strong>. La règle est appliquée par la base de données, pas par cet écran.
        </p>
        <Field label="Adresse exacte">
          <input name="exact_address" className={INPUT} placeholder="Rue 1.234, immeuble Balla, 3e étage" />
        </Field>
        <Field label="Téléphone de l'hôte">
          <input name="contact_phone" className={INPUT} placeholder="+237 6 XX XX XX XX" />
        </Field>
        <Field label="Consignes d'accès">
          <input name="access_notes" className={INPUT} placeholder="Portail bleu, sonner deux fois" />
        </Field>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-brand-700 px-6 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {pending ? 'Enregistrement…' : 'Enregistrer et ajouter les photos →'}
      </button>
    </form>
  );
}

const INPUT =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-ink-900 outline-none focus:border-brand-700';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
      {children}
    </label>
  );
}
