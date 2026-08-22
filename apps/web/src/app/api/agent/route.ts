import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { z } from 'zod';
import { searchListings, getListing, filterAvailable } from '@app/shared';
import { createClient } from '@/lib/supabase/server.ts';
import { createServiceClient } from '@/lib/supabase/service.ts';
import { resolveModel, systemPrompt } from '@/lib/agent/model.ts';

/**
 * Agent conversationnel — Phase 1 du PRD.
 *
 * La clé du modèle vit ICI et nulle part ailleurs (CDC §8.2) : le mobile
 * appellera ce même point d'entrée, il ne parlera jamais au fournisseur.
 *
 * Les recherches passent par le client de SESSION, donc sous RLS : un visiteur
 * non connecté ne voit que les annonces actives, exactement comme sur le site.
 * Utiliser le client de service ici masquerait toute erreur de politique.
 */
export async function POST(request: Request) {
  let model;
  let providerName: string;
  try {
    const resolved = resolveModel();
    model = resolved.model;
    providerName = `${resolved.provider}/${resolved.name}`;
  } catch (error) {
    // Message explicite plutôt qu'une erreur 500 muette : sans clé, on doit
    // savoir laquelle manque, pas chercher.
    return Response.json(
      { error: error instanceof Error ? error.message : 'Modèle non configuré.' },
      { status: 503 },
    );
  }

  const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } =
    await request.json();

  const db = await createClient();

  // `convertToModelMessages` est ASYNCHRONE depuis le SDK v7 — constaté au
  // typecheck, pas supposé. Sans `await`, on passe une promesse là où un
  // tableau est attendu.
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt(),
    messages: modelMessages,
    // Plusieurs allers-retours permettent d'enchaîner recherche puis réponse.
    // Une borne existe pour éviter une boucle qui consommerait sans fin — le
    // coût par conversation est un coût produit, pas un détail (ADR-005).
    stopWhen: stepCountIs(6),
    tools: {
      search_listings: tool({
        description:
          'Cherche des logements réellement publiés et disponibles. À appeler dès que la demande contient un critère exploitable. Renvoie aussi les critères relâchés faute de résultat — il FAUT les annoncer à l’utilisateur.',
        inputSchema: z.object({
          neighborhood: z
            .string()
            .optional()
            .describe('Quartier tel que la personne l’a écrit, sans reformulation.'),
          maxPrice: z.number().int().positive().optional().describe('Budget maximum par nuit, en FCFA.'),
          minPrice: z.number().int().positive().optional(),
          listingType: z.enum(['ROOM', 'STUDIO', 'APARTMENT', 'VILLA']).optional(),
          guests: z.number().int().positive().optional(),
          amenities: z
            .array(
              z.enum([
                'WIFI', 'AC', 'PARKING', 'KITCHEN', 'WATER_HEATER',
                'TV', 'WASHING_MACHINE', 'GENERATOR', 'SECURITY',
              ]),
            )
            .optional(),
          checkIn: z.string().optional().describe('Date d’arrivée, format AAAA-MM-JJ.'),
          checkOut: z.string().optional().describe('Date de départ, format AAAA-MM-JJ.'),
        }),
        execute: async (criteria) => searchListings(db, criteria),
      }),

      get_listing: tool({
        description: 'Détail d’un logement précis, à partir de son identifiant.',
        inputSchema: z.object({ id: z.string().describe('Identifiant du logement.') }),
        execute: async ({ id }) => (await getListing(db, id)) ?? { error: 'Logement introuvable.' },
      }),

      start_booking: tool({
        description:
          "Prépare une demande de réservation et renvoie le lien de la page où elle se termine. À appeler dès que la personne veut réserver. NE JAMAIS annoncer de montant d'avance : il s'affiche sur cette page.",
        inputSchema: z.object({
          id: z.string().describe('Identifiant du logement.'),
          checkIn: z.string().describe('Date d’arrivée, AAAA-MM-JJ.'),
          checkOut: z.string().describe('Date de départ, AAAA-MM-JJ.'),
        }),
        execute: async ({ id, checkIn, checkOut }) => {
          const listing = await getListing(db, id);
          if (!listing) return { error: "Ce logement n'existe plus ou n'est plus publié." };

          const libres = await filterAvailable(db, [id], checkIn, checkOut);
          if (!libres.has(id)) {
            return {
              available: false,
              message: 'Ce logement est déjà pris sur ces dates. Proposez d’autres dates.',
            };
          }

          const nuits = Math.round(
            (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000,
          );
          if (!Number.isFinite(nuits) || nuits < 1) {
            return { error: 'Les dates ne sont pas valides : le départ doit suivre l’arrivée.' };
          }

          // Le total est calculé ICI, à partir du prix réel en base — jamais
          // laissé au modèle. Le montant de l'avance n'est volontairement PAS
          // renvoyé : son taux n'est pas arrêté (ADR-007), et un modèle à qui
          // on ne donne pas un chiffre finit par en inventer un.
          return {
            available: true,
            listingTitle: listing.title,
            neighborhood: listing.neighborhood,
            nights: nuits,
            pricePerNight: listing.pricePerNight,
            totalAmount: nuits * listing.pricePerNight,
            url: `/reserver/${id}?arrivee=${checkIn}&depart=${checkOut}`,
            instruction:
              'Donne ce lien à la personne. Le montant de l’avance et les conditions s’affichent sur cette page.',
          };
        },
      }),

      check_availability: tool({
        description:
          'Vérifie si un logement est libre sur une période. À utiliser avant d’affirmer qu’une réservation est possible.',
        inputSchema: z.object({
          id: z.string(),
          checkIn: z.string().describe('AAAA-MM-JJ'),
          checkOut: z.string().describe('AAAA-MM-JJ'),
        }),
        execute: async ({ id, checkIn, checkOut }) => {
          const free = await filterAvailable(db, [id], checkIn, checkOut);
          return { available: free.has(id), checkIn, checkOut };
        },
      }),
    },

    // Journalisation : elle sert la mesure S3 du PRD — « ≥ 80 % des requêtes
    // produisent un résultat pertinent », évalué sur des conversations
    // relues à la main. Sans trace, le critère qui décide de la suite du
    // produit n'est pas mesurable.
    onFinish: async ({ text }) => {
      try {
        await logConversation(sessionId, messages, text, providerName);
      } catch {
        // Une panne de journalisation ne doit jamais casser une conversation.
        // On perd une mesure, pas un utilisateur.
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

async function logConversation(
  sessionId: string | undefined,
  messages: UIMessage[],
  answer: string,
  providerName: string,
): Promise<void> {
  const service = createServiceClient();

  let id = sessionId;
  if (!id) {
    const { data } = await service
      .from('chat_sessions')
      .insert({ client_key: providerName })
      .select('id')
      .single();
    id = data?.id;
  }
  if (!id) return;

  const last = messages.at(-1);
  const question = last?.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join(' ');

  const rows = [];
  if (question) rows.push({ session_id: id, role: 'user', content: question });
  if (answer) rows.push({ session_id: id, role: 'assistant', content: answer });
  if (rows.length > 0) await service.from('chat_messages').insert(rows);
}
