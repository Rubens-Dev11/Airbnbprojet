/**
 * Types partagés entre le web et le mobile.
 *
 * `database.types.ts` est GÉNÉRÉ depuis le schéma réel :
 *
 *   pnpm db:types
 *
 * Ne jamais l'éditer à la main — la prochaine génération écraserait la
 * modification, et un type écrit à la main finit toujours par mentir sur ce
 * que la base contient vraiment.
 */
export type { Database, Json } from './database.types.ts';

/** Outils de l'agent conversationnel — testables sans modèle de langage. */
export {
  resolveNeighborhood,
  searchListings,
  filterAvailable,
  getListing,
} from './agent-tools.ts';
export type { ListingHit, SearchCriteria, SearchOutcome } from './agent-tools.ts';

import type { Database } from './database.types.ts';

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

export type Profile = Tables['profiles']['Row'];
export type Listing = Tables['listings']['Row'];
export type ListingInsert = Tables['listings']['Insert'];
export type ListingContact = Tables['listing_contacts']['Row'];
export type ListingImage = Tables['listing_images']['Row'];
export type Booking = Tables['bookings']['Row'];
export type ListingBlock = Tables['listing_blocks']['Row'];
export type Payment = Tables['payments']['Row'];
export type Neighborhood = Tables['neighborhoods']['Row'];
export type ChatSession = Tables['chat_sessions']['Row'];
export type ChatMessage = Tables['chat_messages']['Row'];

export type UserRole = Enums['user_role'];
export type ListingType = Enums['listing_type'];
export type BookingStatus = Enums['booking_status'];
export type PaymentStatus = Enums['payment_status'];

/**
 * Équipements normalisés.
 *
 * Le CDC §5.1 cite « climatisation, WiFi, parking, cuisine ». La liste est
 * fermée volontairement : sur du texte libre, un logement saisi « clim » et un
 * autre « climatisation » deviennent invisibles au même filtre — et l'agent IA
 * ne peut plus les rapprocher.
 */
export const AMENITIES = [
  'WIFI',
  'AC',
  'PARKING',
  'KITCHEN',
  'WATER_HEATER',
  'TV',
  'WASHING_MACHINE',
  'GENERATOR',
  'SECURITY',
] as const;

export type Amenity = (typeof AMENITIES)[number];

/** Libellés français destinés à l'affichage. Le stockage reste en anglais. */
export const AMENITY_LABELS: Record<Amenity, string> = {
  WIFI: 'WiFi',
  AC: 'Climatisation',
  PARKING: 'Parking',
  KITCHEN: 'Cuisine équipée',
  WATER_HEATER: 'Chauffe-eau',
  TV: 'Télévision',
  WASHING_MACHINE: 'Machine à laver',
  GENERATOR: 'Groupe électrogène',
  SECURITY: 'Gardiennage',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  ROOM: 'Chambre',
  STUDIO: 'Studio',
  APARTMENT: 'Appartement',
  VILLA: 'Villa',
};

/**
 * Formate un montant en francs CFA.
 *
 * Le FCFA n'a pas de décimales : on n'affiche donc jamais de virgule, et le
 * montant est toujours un entier. Un flottant ici serait une erreur, pas une
 * approximation.
 */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}
