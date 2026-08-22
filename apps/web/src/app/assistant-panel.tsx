'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { formatFcfa } from '@app/shared';

/**
 * Assistant conversationnel — canal de réservation PRINCIPAL (ADR-005).
 *
 * Disposition : au centre de l'accueil, pas en bulle dans un coin. Les
 * maquettes fournies montrent le panneau d'assistance SFR, qui est un patron
 * de support secondaire ; en reprendre la place aurait contredit ADR-005, où
 * l'agent est le différenciateur du produit face à PUOL. On en garde donc la
 * FORME — en-tête, bulles, champ de saisie ancré en bas — et on lui donne la
 * place centrale.
 *
 * Les suggestions d'amorce ne sont pas décoratives : sur un catalogue jeune,
 * un champ vide ne dit pas ce qu'on peut demander. Elles montrent la forme
 * d'une requête utile.
 */
const AMORCES = [
  'Un studio climatisé à Akwa, moins de 25 000 la nuit',
  'Une chambre à Bonamoussadi pour deux personnes',
  'Qu’est-ce que vous avez à Bepanda ?',
];

export function AssistantPanel() {
  const [input, setInput] = useState('');

  // `useChat` poste par DÉFAUT vers /api/chat. Notre route est /api/agent :
  // sans ce transport, chaque envoi tombait sur le 404 de Next, dont la page
  // HTML complète était affichée comme message d'erreur. Constaté à l'écran
  // le 22 août 2026 — invisible au typecheck et au build, puisque les deux
  // chemins sont valides.
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
  });

  const busy = status === 'submitted' || status === 'streaming';

  function envoyer(texte: string) {
    const t = texte.trim();
    if (!t || busy) return;
    setInput('');
    void sendMessage({ text: t });
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-brand-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 bg-brand-700 px-5 py-3">
        <span aria-hidden className="text-lg">💬</span>
        <div>
          <h2 className="font-medium text-white">Dites ce que vous cherchez</h2>
          <p className="text-sm text-brand-100">
            En une phrase, comme à quelqu&apos;un qui connaît la ville
          </p>
        </div>
      </header>

      <div className="flex min-h-[18rem] flex-col gap-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-700">
              Par exemple&nbsp;:
            </p>
            <div className="flex flex-col items-start gap-2">
              {AMORCES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => envoyer(a)}
                  disabled={busy}
                  className="rounded-full border border-brand-300 px-4 py-2 text-left text-sm text-brand-800 hover:bg-brand-50 disabled:opacity-50"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-brand-700 px-4 py-2.5 text-white'
                  : 'flex max-w-[85%] flex-col gap-3'
              }
            >
              {m.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                // Les résultats de recherche sont rendus comme des cartes, pas
                // recopiés en texte : le modèle pourrait déformer un prix en le
                // réécrivant. Ce qui vient de la base s'affiche tel quel.
                if (part.type === 'tool-search_listings' && part.state === 'output-available') {
                  return <ResultatsRecherche key={i} sortie={part.output} />;
                }
                // `startsWith` ne restreint pas l'union TypeScript : il faut
                // vérifier la présence de `state` avant de la lire.
                if (
                  part.type.startsWith('tool-') &&
                  'state' in part &&
                  part.state !== 'output-available'
                ) {
                  return (
                    <p key={i} className="text-sm text-gray-500">
                      Recherche dans le catalogue…
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {busy && messages.length > 0 && (
          <p className="text-sm text-gray-500">L&apos;assistant réfléchit…</p>
        )}

        {error && <MessageErreur brut={error.message} />}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          envoyer(input);
        }}
        className="flex items-center gap-2 border-t border-gray-300 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Un studio à Akwa pour ce week-end…"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-ink-900 outline-none focus:border-brand-700"
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="rounded-full bg-brand-700 px-5 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-40"
        >
          Envoyer
        </button>
      </form>
    </section>
  );
}

/**
 * Affiche une erreur de façon lisible.
 *
 * Le message brut peut être une page HTML entière — c'est arrivé le
 * 22 août 2026, une page 404 de Next déversée dans la conversation sur
 * plusieurs écrans de haut. Un message d'erreur illisible ne vaut pas mieux
 * qu'une erreur silencieuse : on montre une phrase compréhensible, et le
 * détail technique reste accessible dans un bloc repliable.
 */
function MessageErreur({ brut }: { brut: string }) {
  const estHtml = /<\/?[a-z][\s\S]*>/i.test(brut);
  const resume = estHtml
    ? "L'assistant est injoignable. Le serveur a renvoyé une page au lieu d'une réponse."
    : brut.slice(0, 300);

  return (
    <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
      <p>{resume}</p>
      {estHtml && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-red-800">Détail technique</summary>
          <pre className="mt-1 max-h-32 overflow-auto text-xs whitespace-pre-wrap">
            {brut.slice(0, 500)}
          </pre>
        </details>
      )}
    </div>
  );
}

/** Rend les logements renvoyés par l'outil, sans passer par le modèle. */
function ResultatsRecherche({ sortie }: { sortie: unknown }) {
  const o = sortie as {
    results?: {
      id: string;
      title: string;
      neighborhood: string;
      pricePerNight: number;
      missing?: string[];
    }[];
    warning?: string;
    unknownNeighborhood?: string;
  };

  if (!o?.results) return null;

  return (
    <div className="flex flex-col gap-2">
      {o.unknownNeighborhood && (
        <p className="text-sm text-gray-500">
          Quartier « {o.unknownNeighborhood} » inconnu de notre référentiel.
        </p>
      )}
      {/* L'avertissement vient de l'outil, pas du modèle : il est donc affiché
          même si le modèle décide de l'ignorer dans sa prose. */}
      {o.warning && (
        <p className="rounded border border-accent-500 bg-white px-3 py-2 text-sm text-accent-500">
          {o.warning}
        </p>
      )}
      {o.results.length === 0 ? (
        <p className="text-sm text-gray-500">Aucun logement ne correspond.</p>
      ) : (
        o.results.map((r) => (
          <article key={r.id} className="rounded border border-gray-300 p-3">
            <p className="font-medium text-ink-900">{r.title}</p>
            <p className="text-sm text-gray-500">{r.neighborhood}</p>
            <p className="mt-1 font-medium text-brand-700">
              {formatFcfa(r.pricePerNight)} <span className="text-gray-500">/ nuit</span>
            </p>
            {r.missing && r.missing.length > 0 && (
              <p className="mt-1 text-sm text-accent-500">
                N&apos;a pas&nbsp;: {r.missing.join(', ')}
              </p>
            )}
            {/* Chemin vers la réservation rendu par NOUS, pas par le modèle.
                Mesuré le 22 août 2026 : llama-3.3-70b n'appelle pas
                systématiquement start_booking même quand la personne dit
                vouloir réserver — il redemande confirmation. Faire dépendre
                le parcours critique de l'obéissance d'un modèle serait une
                faute : ces liens marchent toujours. */}
            <div className="mt-3 flex gap-3 text-sm">
              <Link href={`/logement/${r.id}`} className="text-brand-700 hover:underline">
                Voir la fiche
              </Link>
              <Link
                href={`/reserver/${r.id}`}
                className="rounded bg-brand-700 px-3 py-1.5 font-medium text-white hover:bg-brand-600"
              >
                Réserver
              </Link>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
