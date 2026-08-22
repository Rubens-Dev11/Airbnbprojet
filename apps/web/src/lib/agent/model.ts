import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

/**
 * Choix du fournisseur de modèle — délibérément une VARIABLE, pas une décision
 * gravée dans le code.
 *
 * Le cahier des charges §5.3 impose OpenAI. Cette exigence a été héritée du
 * document d'origine, elle n'a jamais été arbitrée sur ses mérites. Or la
 * latence, mesurée depuis le Cameroun le 7 août 2026, ne tranche pas :
 *
 *   api.openai.com     connect  41 ms
 *   api.anthropic.com  connect  68 ms
 *
 * 27 ms d'écart, à comparer aux ~250 ms de chaque aller-retour vers la base
 * (ADR-004). Le réseau ne décide donc rien ici. Ce qui décidera, c'est la
 * qualité de compréhension sur de vraies demandes en français camerounais —
 * exactement ce que la Phase 1 doit mesurer.
 *
 * D'où cette abstraction : basculer coûte une variable d'environnement, et on
 * peut comparer les deux sur le MÊME jeu de requêtes.
 */
export type AgentProvider = 'openai' | 'anthropic' | 'nvidia';

/**
 * NVIDIA NIM expose une API **compatible OpenAI** — vérifié le 22 août 2026 :
 * `GET https://integrate.api.nvidia.com/v1/models` répond 200 au format
 * OpenAI. Un seul `baseURL` suffit donc, pas de client dédié.
 *
 * Latence mesurée depuis le Cameroun le même jour :
 *   integrate.api.nvidia.com  connect 49 ms   TLS 288 ms
 *   api.openai.com            connect 30 ms   TLS  74 ms
 *   api.anthropic.com         connect 41 ms   TLS  91 ms
 *
 * La poignée TLS de NVIDIA est ~200 ms plus lente. Sur une connexion
 * maintenue ouverte l'écart s'amortit ; sur une première requête, il s'ajoute
 * au budget des 3 secondes du PRD (S5). À surveiller, pas rédhibitoire.
 */
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export function resolveModel(): { model: LanguageModel; provider: AgentProvider; name: string } {
  const provider = (process.env.AGENT_PROVIDER ?? 'nvidia') as AgentProvider;

  if (provider === 'nvidia') {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error('NVIDIA_API_KEY manquante. Voir .env.example.');
    // Mistral Large : solide en français et gère les appels d'outils, ce qui
    // est indispensable ici — un modèle sans outils ne peut pas chercher dans
    // le catalogue, il ne peut qu'inventer.
    // ⚠ DEUX PIÈGES, tous deux constatés à l'exécution le 22 août 2026.
    //
    // 1. La liste publique de /v1/models n'est PAS la liste des modèles
    //    accessibles à un compte : `mistral-large-2-instruct` y figure et
    //    renvoie « Not found for account ».
    //
    // 2. Surtout : `mistralai/mistral-nemotron` N'ENVOIE JAMAIS de
    //    `finish_reason` en streaming. Sans lui, le SDK ne peut pas savoir que
    //    le tour s'est terminé par un appel d'outil : il classe en « other »,
    //    la boucle s'arrête, l'outil n'est jamais exécuté et la réponse est
    //    VIDE. Sans streaming le même modèle renvoie bien « tool_calls » —
    //    c'est donc un défaut de son implémentation du flux.
    //
    // Sondage des 5 modèles accessibles, en streaming avec outils :
    //   meta/llama-3.3-70b-instruct                tool_calls  ✓
    //   meta/llama-3.1-70b-instruct                tool_calls  ✓
    //   meta/llama-3.1-8b-instruct                 tool_calls  ✓
    //   mistralai/mistral-nemotron                 AUCUN       ✗
    //   nvidia/llama-3.3-nemotron-super-49b-v1.5   length, n'appelle pas l'outil ✗
    //
    // Retenu : le 70B, le plus grand de ceux qui fonctionnent.
    const name = process.env.AGENT_MODEL ?? 'meta/llama-3.3-70b-instruct';
    // `.chat()` et NON l'appel direct : depuis @ai-sdk/openai v4, l'appel par
    // défaut vise l'API « Responses » d'OpenAI (`/v1/responses`), que NVIDIA
    // n'implémente pas — elle répond 404. `.chat()` vise
    // `/v1/chat/completions`, le seul point d'entrée compatible.
    // Constaté à l'exécution le 22 août 2026, pas supposé.
    return {
      model: createOpenAI({ apiKey, baseURL: NVIDIA_BASE_URL }).chat(name),
      provider,
      name,
    };
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante. Voir .env.example.');
    const name = process.env.AGENT_MODEL ?? 'claude-sonnet-5';
    return { model: createAnthropic({ apiKey })(name), provider, name };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY manquante. Voir .env.example.');
  const name = process.env.AGENT_MODEL ?? 'gpt-4o';
  return { model: createOpenAI({ apiKey })(name), provider, name };
}

/**
 * Consigne système.
 *
 * Elle est écrite pour empêcher trois fautes qui tueraient le produit :
 *
 *   1. Inventer un logement. Le CDC §1 identifie les « informations non
 *      fiables » comme problème central du marché — un agent qui invente
 *      reproduit exactement ce qu'on prétend corriger.
 *   2. Proposer un logement hors critère sans le dire. Une alternative
 *      annoncée est utile ; la même, tue, est un mensonge.
 *   3. Afficher des centimes. Le FCFA n'en a pas.
 */
export const SYSTEM_PROMPT = `Tu es l'assistant de réservation d'une plateforme de chambres meublées à Douala, au Cameroun.

Tu parles français, simplement et brièvement. Tu tutoies rarement : le vouvoiement est la norme.

RÈGLES ABSOLUES
- Tu ne proposes QUE des logements retournés par l'outil search_listings. Tu n'inventes jamais un logement, un prix, un quartier ni une disponibilité. Si l'outil ne renvoie rien, tu le dis.
- Si l'outil signale des critères relâchés (champ "relaxed"), tu l'annonces explicitement. Exemple : « Rien à moins de 20 000 à Akwa, voici ce qui existe un peu au-dessus. » Ne jamais présenter un résultat hors budget comme s'il respectait le budget.
- Si l'outil signale "unknownNeighborhood", dis que tu ne connais pas ce quartier et propose ceux que tu couvres.
- Les prix sont en FCFA, toujours des nombres entiers, sans centimes. Écris « 16 500 FCFA », jamais « 16500,00 ».
- Tu ne donnes jamais l'adresse exacte ni le téléphone d'un hôte : ils ne sont révélés qu'après paiement de l'avance. Si on te les demande, explique cela.

MÉTHODE
- Extrais des critères de la demande : quartier, budget maximum, dates, type de logement, nombre de personnes, équipements.
- Si une information manque et qu'elle change le résultat, pose UNE question, pas trois.
- Appelle search_listings dès que tu as de quoi chercher. Ne demande pas de précisions que tu pourrais deviner.
- Présente au maximum 3 logements, avec pour chacun : titre, quartier, prix par nuit, et ce qui le distingue.
- Termine en proposant la suite : voir la fiche, ou affiner.

CONTEXTE LOCAL
- Les quartiers sont ceux de Douala : Akwa, Bonanjo, Bonapriso, Deido, Bepanda, Makepe, Bonamoussadi, Logpom, Bonaberi, etc. Les gens les écrivent de plusieurs façons ; l'outil s'en charge, passe le texte tel qu'il est donné.
- Les équipements possibles sont : WIFI, AC (climatisation), PARKING, KITCHEN, WATER_HEATER, TV, WASHING_MACHINE, GENERATOR, SECURITY.
- Les types sont : ROOM (chambre), STUDIO, APARTMENT (appartement), VILLA.`;
