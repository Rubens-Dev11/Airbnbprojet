/**
 * Règles de tarification.
 *
 * ⚠ LE TAUX D'AVANCE N'EST PAS ARRÊTÉ. ADR-007 le dit explicitement : les
 * chiffres de `plan.md` (30 % d'avance, 10 % de commission) n'ont pas été
 * repris, parce qu'ils reposent sur un panier moyen de 22 000 FCFA la nuit
 * alors que le seul prix réellement observé sur le marché est une annonce
 * PUOL à 16 500 FCFA.
 *
 * La valeur ci-dessous est donc PROVISOIRE et pilotée par variable
 * d'environnement. Elle vit ici, à un seul endroit, pour que l'arbitrage réel
 * coûte une ligne — et pour qu'aucun modèle de langage n'ait à la deviner.
 */
const TAUX_AVANCE_DEFAUT = 30;

export function tauxAvancePourcent(): number {
  const brut = process.env.DEPOSIT_RATE_PERCENT;
  const valeur = brut ? Number(brut) : TAUX_AVANCE_DEFAUT;
  if (!Number.isFinite(valeur) || valeur <= 0 || valeur > 100) return TAUX_AVANCE_DEFAUT;
  return valeur;
}

/**
 * Calcule les montants d'une réservation.
 *
 * Tout est en ENTIERS de FCFA : le franc CFA n'a pas de décimales. L'avance
 * est arrondie à la centaine supérieure — on ne demande pas « 5 427 FCFA » à
 * quelqu'un qui paie par Mobile Money.
 */
export function calculerMontants(pricePerNight: number, nights: number) {
  const total = pricePerNight * nights;
  const brut = (total * tauxAvancePourcent()) / 100;
  const avance = Math.min(total, Math.ceil(brut / 100) * 100);
  return { total, avance, solde: total - avance, tauxPourcent: tauxAvancePourcent() };
}

/** Nombre de nuits entre deux dates, intervalle semi-ouvert. */
export function compterNuits(arrivee: string, depart: string): number | null {
  const a = Date.parse(arrivee);
  const d = Date.parse(depart);
  if (!Number.isFinite(a) || !Number.isFinite(d)) return null;
  const n = Math.round((d - a) / 86_400_000);
  return n >= 1 ? n : null;
}
