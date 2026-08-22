/**
 * Passe de mesure de l'agent — critère S3 du PRD.
 *
 *   pnpm agent:measure
 *
 * « ≥ 80 % des requêtes en langage naturel produisent un résultat pertinent »,
 * évalué sur des conversations réelles relues à la main.
 *
 * Ce script ne REMPLACE pas la relecture : il exécute les requêtes, détecte
 * mécaniquement ce qui est détectable (inventions, comportements interdits,
 * latence) et présente le reste pour jugement humain. Un score automatique
 * seul donnerait une fausse certitude sur un critère qui décide de la suite du
 * produit.
 */
// Marque le fichier comme module ES : sans cela, TypeScript refuse le `await`
// de premier niveau utilisé plus bas. Node l'exécute correctement dans les
// deux cas — c'est le typecheck qui l'exige, et il a raison de l'exiger.
export {};

const BASE = process.env.AGENT_BASE_URL ?? 'http://localhost:3000';

type Cas = {
  requete: string;
  /** Ce qu'une bonne réponse doit contenir. Jugé à la relecture. */
  attendu: string;
  /** L'outil doit-il renvoyer au moins un logement ? */
  resultatsAttendus: 'oui' | 'non' | 'peu importe';
};

const CAS: Cas[] = [
  { requete: 'Je cherche une chambre à Akwa', attendu: 'aucune chambre à Akwa au catalogue — doit le dire, peut proposer un autre quartier ou un studio', resultatsAttendus: 'peu importe' },
  { requete: 'Un studio à Akwa', attendu: 'le studio à 28 000', resultatsAttendus: 'oui' },
  { requete: 'studio akwa moins de 30000', attendu: 'le studio à 28 000, sans élargissement', resultatsAttendus: 'oui' },
  { requete: 'Je veux une chambre pas chère', attendu: 'la chambre à Ndogbong (8 000) ou Bali (10 000)', resultatsAttendus: 'oui' },
  { requete: 'Quelque chose à moins de 15 000 la nuit', attendu: 'les chambres à 8 000, 10 000, 12 000, 13 000', resultatsAttendus: 'oui' },
  { requete: 'un logement climatisé à Bonapriso', attendu: 'le studio à 35 000 ou la villa à 95 000', resultatsAttendus: 'oui' },
  { requete: 'appartement pour une famille de 5 personnes', attendu: "l'appartement familial de Bonamoussadi (42 000, 5 personnes)", resultatsAttendus: 'oui' },
  { requete: 'je cherche vers bepanda tapis rouge', attendu: 'la chambre de Bepanda à 12 000 — doit reconnaître l’alias', resultatsAttendus: 'oui' },
  { requete: 'une chambre au centre administratif', attendu: "Bonanjo — n'a qu'un appartement, doit le dire ou l'élargir en le signalant", resultatsAttendus: 'peu importe' },
  { requete: 'quelque chose à Ouagadougou', attendu: 'doit dire que ce quartier est inconnu', resultatsAttendus: 'non' },
  { requete: 'une villa avec gardien et groupe électrogène', attendu: 'la villa de Bonapriso ou de Logbessou', resultatsAttendus: 'oui' },
  { requete: 'un studio avec machine à laver', attendu: 'le studio de Logpom (24 000)', resultatsAttendus: 'oui' },
  { requete: 'je veux un logement à moins de 3000 francs', attendu: 'rien à ce prix — doit élargir EN LE DISANT, ou dire qu’il n’y a rien', resultatsAttendus: 'peu importe' },
  { requete: 'un appartement de l’autre côté du pont', attendu: 'Bonaberi (32 000) — demande une connaissance locale', resultatsAttendus: 'peu importe' },
  { requete: 'studio à Makepe pour demain, deux nuits', attendu: 'le studio de Makepe, dates comprises', resultatsAttendus: 'oui' },
  { requete: 'combien coûte la chambre la moins chère ?', attendu: '8 000 FCFA à Ndogbong', resultatsAttendus: 'oui' },
  { requete: 'je veux réserver le studio de Deido', attendu: 'doit donner un lien de réservation ou guider vers la fiche', resultatsAttendus: 'peu importe' },
  { requete: 'vous avez quoi à Bonamoussadi ?', attendu: 'le studio à 22 000 et l’appartement à 42 000', resultatsAttendus: 'oui' },
  { requete: 'un logement avec parking et wifi pas trop cher', attendu: 'Bonaberi (32 000) a parking et wifi', resultatsAttendus: 'oui' },
  { requete: 'quelle est l’adresse exacte du studio de Makepe ?', attendu: 'doit REFUSER : adresse révélée après paiement de l’avance', resultatsAttendus: 'peu importe' },
];

/** Comportements interdits, détectables mécaniquement. */
const INTERDITS: { nom: string; motif: RegExp }[] = [
  { nom: 'renvoie vers l’hôte', motif: /contact\w*.{0,25}(directement|l.h[oô]te)|appelez l.h[oô]te|arrangez-vous/i },
  { nom: 'invente un taux', motif: /\b\d{1,2}\s?%|pour ?cent du montant/i },
  { nom: 'demande des données perso', motif: /votre nom|num[eé]ro de t[eé]l[eé]phone|votre email/i },
  { nom: 'pense tout haut', motif: /je (vais|dois) (appeler|utiliser|corriger)|voici la commande|<\/?[a-z]+>/i },
  { nom: 'donne une adresse exacte', motif: /rue \d|immeuble \w+, \d|porte \d/i },
];

/**
 * Délai par requête. Le palier gratuit répond entre 30 et 80 secondes ; sans
 * borne explicite, `undici` coupe le corps de réponse au bout de 5 minutes et
 * lève UND_ERR_BODY_TIMEOUT — ce qui, le 22 août 2026, a tué deux passes de
 * mesure entières à 14 et 10 requêtes sur 20. Une borne connue vaut mieux
 * qu'une borne subie.
 */
const DELAI_MS = 150_000;

async function interroger(requete: string) {
  const t0 = Date.now();
  const reponse = await fetch(`${BASE}/api/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: requete }] }],
    }),
    signal: AbortSignal.timeout(DELAI_MS),
  });

  const flux = await reponse.text();
  let texte = '';
  let premierMot: number | null = null;
  let nbResultats: number | null = null;
  const outils: string[] = [];
  let erreur: string | null = null;

  for (const ligne of flux.split('\n')) {
    if (!ligne.startsWith('data: ')) continue;
    const brut = ligne.slice(6).trim();
    if (brut === '[DONE]') continue;
    let j: any;
    try { j = JSON.parse(brut); } catch { continue; }

    if (j.type === 'text-delta' && j.delta) {
      if (premierMot === null) premierMot = Date.now() - t0;
      texte += j.delta;
    }
    if (j.type === 'tool-input-available') outils.push(j.toolName);
    if (j.type === 'tool-output-available' && Array.isArray(j.output?.results)) {
      nbResultats = j.output.results.length;
    }
    if (j.type === 'error') erreur = j.errorText;
  }

  return { texte, premierMot, total: Date.now() - t0, nbResultats, outils, erreur };
}

console.log(`Mesure de l'agent — ${CAS.length} requêtes contre ${BASE}\n`);

let violations = 0;
let sansOutil = 0;
let resultatsInattendus = 0;
const latences: number[] = [];

let echecsTechniques = 0;

for (const [i, cas] of CAS.entries()) {
  const num = String(i + 1).padStart(2, '0');
  console.log(`─── ${num}. « ${cas.requete} »`);
  console.log(`    attendu : ${cas.attendu}`);

  // Une requête qui échoue ne doit PAS emporter la passe. Perdre une mesure
  // est acceptable ; perdre dix-neuf mesures parce que la vingtième a calé ne
  // l'est pas.
  let r: Awaited<ReturnType<typeof interroger>>;
  try {
    r = await interroger(cas.requete);
  } catch (e) {
    const cause = e instanceof Error ? `${e.name} : ${e.message}` : String(e);
    console.log(`    ECHEC TECHNIQUE : ${cause}\n`);
    echecsTechniques += 1;
    continue;
  }

  if (r.erreur) {
    console.log(`    ERREUR : ${r.erreur}\n`);
    violations += 1;
    continue;
  }

  if (r.premierMot !== null) latences.push(r.premierMot);

  const problemes: string[] = [];

  if (r.outils.length === 0) {
    problemes.push('AUCUN OUTIL APPELÉ');
    sansOutil += 1;
  }
  if (cas.resultatsAttendus === 'oui' && !r.nbResultats) {
    problemes.push('aucun résultat alors qu’il en fallait');
    resultatsInattendus += 1;
  }
  if (cas.resultatsAttendus === 'non' && r.nbResultats) {
    problemes.push('des résultats alors qu’il ne devait pas y en avoir');
    resultatsInattendus += 1;
  }
  for (const it of INTERDITS) {
    if (it.motif.test(r.texte)) problemes.push(`INTERDIT : ${it.nom}`);
  }
  violations += problemes.filter((p) => p.startsWith('INTERDIT') || p.includes('AUCUN')).length;

  console.log(
    `    outils : ${r.outils.join(', ') || 'aucun'} · résultats : ${r.nbResultats ?? '—'} · ` +
      `1er mot : ${r.premierMot !== null ? (r.premierMot / 1000).toFixed(1) + 's' : 'n/a'}`,
  );
  if (problemes.length) console.log(`    ⚠ ${problemes.join(' | ')}`);
  console.log(`    → ${r.texte.replace(/\n+/g, ' ').slice(0, 260)}\n`);
}

latences.sort((a, b) => a - b);
const median = latences.length ? latences[Math.floor(latences.length / 2)]! / 1000 : 0;
const sousCible = latences.filter((l) => l < 3000).length;

console.log('═══ SYNTHÈSE ═══');
console.log(`Requêtes                         : ${CAS.length}`);
console.log(`Échecs techniques (hors mesure)  : ${echecsTechniques}`);
console.log(`Comportements interdits détectés : ${violations}`);
console.log(`Requêtes sans appel d'outil      : ${sansOutil}`);
console.log(`Résultats non conformes          : ${resultatsInattendus}`);
console.log(`Latence médiane (1er mot)        : ${median.toFixed(1)}s   — cible PRD S5 : < 3,0s`);
console.log(`Sous la cible de 3s              : ${sousCible}/${latences.length}`);
console.log(
  '\nLa pertinence (critère S3) se juge À LA LECTURE des réponses ci-dessus.\n' +
    'Ce script mesure ce qui est mesurable ; il ne remplace pas ce jugement.',
);
