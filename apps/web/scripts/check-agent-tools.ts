/**
 * Exerce les outils de l'agent contre la base locale, SANS modèle de langage.
 *
 *   pnpm agent:check
 *
 * Pourquoi cela existe séparément : le critère S3 du PRD — « ≥ 80 % des
 * requêtes produisent un résultat pertinent » — se joue d'abord dans les
 * outils. Si `search_listings` ne trouve pas un logement qui existe, aucun
 * modèle ne rattrapera l'erreur, et on perdra du temps à ajuster une consigne
 * système alors que le défaut est dans une requête SQL.
 *
 * Aucune clé d'API n'est nécessaire.
 */
import { createClient } from '@supabase/supabase-js';
import { resolveNeighborhood, searchListings } from '@app/shared';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    'NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requis.\n' +
      'Ils sont dans apps/web/.env.local — lancez via `pnpm agent:check`.',
  );
  process.exit(1);
}

// Clé anonyme volontairement : l'agent doit fonctionner pour un visiteur non
// connecté (PRD US-001). Utiliser la clé de service masquerait toute erreur de
// politique RLS.
const db = createClient(url, key);

let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  if (!ok) failures += 1;
  console.log(`${ok ? 'OK   ' : 'ECHEC'} ${label}${detail ? `  — ${detail}` : ''}`);
}

console.log('--- Reconnaissance des quartiers ---');

for (const [input, expected] of [
  ['Akwa', 'Akwa'],
  ['akwa', 'Akwa'],
  ['akwa nord', 'Akwa'],
  ['vers Akwa', 'Akwa'],
  ['bepanda tapis rouge', 'Bepanda'],
  ['tapis rouge', 'Bepanda'],
  ['centre administratif', 'Bonanjo'],
  ['bonandjo', 'Bonanjo'],
  ['carrefour andem', 'Carrefour Andem'],
  ['bonamoussadi', 'Bonamoussadi'],
] as const) {
  const found = await resolveNeighborhood(db, input);
  check(`« ${input} » → ${expected}`, found?.name === expected, found ? found.name : 'introuvable');
}

// Un quartier qui n'existe pas DOIT être signalé, pas silencieusement ignoré :
// l'agent doit pouvoir dire « je ne connais pas ce quartier ».
const unknown = await resolveNeighborhood(db, 'Ouagadougou');
check('« Ouagadougou » → introuvable (attendu)', unknown === null, unknown?.name ?? 'null');

console.log('\n--- Recherche ---');

const all = await searchListings(db, {});
check('recherche sans critere renvoie les annonces publiees', all.results.length > 0,
  `${all.results.length} resultat(s)`);

if (all.results.length === 0) {
  console.log('\nAucune annonce publiee en base : les tests de recherche ne prouvent rien.');
  console.log('Creez et publiez au moins une annonce, puis relancez.');
  process.exit(1);
}

const sample = all.results[0]!;
console.log(`  echantillon : « ${sample.title} » — ${sample.neighborhood}, ${sample.pricePerNight} FCFA`);

const byNeighborhood = await searchListings(db, { neighborhood: sample.neighborhood });
check(
  `recherche par quartier « ${sample.neighborhood} »`,
  byNeighborhood.results.some((r) => r.id === sample.id),
);

const withinBudget = await searchListings(db, { maxPrice: sample.pricePerNight });
check(
  `budget >= prix (${sample.pricePerNight}) trouve l'annonce`,
  withinBudget.results.some((r) => r.id === sample.id),
);

// Budget impossible : le logement ne doit PAS apparaître au prix demandé.
// S'il apparaît, ce doit être en critère RELÂCHÉ et signalé comme tel.
const tooCheap = await searchListings(db, { maxPrice: 1000 });
const leaked = tooCheap.results.some((r) => r.pricePerNight > 1000);
check(
  'budget irrealiste : soit aucun resultat, soit relachement SIGNALE',
  !leaked || tooCheap.relaxed.includes('maxPrice'),
  `${tooCheap.results.length} resultat(s), relaches: [${tooCheap.relaxed.join(', ') || 'aucun'}]`,
);

const unknownQuartier = await searchListings(db, { neighborhood: 'Ouagadougou' });
check(
  'quartier inconnu remonte dans unknownNeighborhood',
  unknownQuartier.unknownNeighborhood === 'Ouagadougou',
  unknownQuartier.unknownNeighborhood ?? 'non signale',
);

console.log('\n--- Vocabulaire rendu au modele ---');

// Régression du 22 août 2026 : l'outil renvoyait les codes bruts (AC,
// WATER_HEATER) et le modèle les traduisait lui-même — il a inventé un
// « réfrigérateur » et un « générateur » absents, tout en OUBLIANT la
// climatisation. Les libellés doivent arriver traduits, sinon le modèle
// devine.
const codesBruts = ['AC', 'WIFI', 'KITCHEN', 'WATER_HEATER', 'TV', 'PARKING', 'GENERATOR'];
const fuites = all.results.flatMap((r) => r.amenities.filter((a) => codesBruts.includes(a)));
check(
  'les equipements sont en francais, pas des codes bruts',
  fuites.length === 0,
  fuites.length ? `codes non traduits : ${[...new Set(fuites)].join(', ')}` : '',
);

const typesBruts = ['ROOM', 'STUDIO', 'APARTMENT', 'VILLA'];
const fuiteType = all.results.filter((r) => typesBruts.includes(r.listingType));
check(
  'le type de logement est en francais',
  fuiteType.length === 0,
  fuiteType.length ? `non traduit : ${fuiteType[0]!.listingType}` : '',
);

console.log(`  echantillon : ${JSON.stringify(sample.amenities)} — type « ${sample.listingType} »`);

console.log('\n--- Disponibilite ---');

const free = await searchListings(db, { checkIn: '2027-01-10', checkOut: '2027-01-13' });
check('dates libres : l\'annonce est proposee', free.results.some((r) => r.id === sample.id),
  `${free.results.length} resultat(s)`);

console.log(`\n${failures === 0 ? 'Aucune violation.' : `${failures} echec(s).`}`);
process.exit(failures > 0 ? 1 : 0);
