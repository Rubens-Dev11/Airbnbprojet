/**
 * Remplit la base d'annonces de DÉMONSTRATION.
 *
 *   pnpm seed:demo          crée les annonces
 *   pnpm seed:demo -- --purge   les efface toutes
 *
 * ⚠ CES ANNONCES SONT INVENTÉES. Elles portent `is_demo = true`, l'interface
 * publique les signale, et elles s'effacent en une commande. Elles servent à
 * développer et à mesurer l'agent — à une seule annonce, tout marche par
 * accident. Elles ne remplacent PAS l'amorçage réel du catalogue, qui reste
 * la Phase 0 du PRD : 30 annonces de vrais propriétaires.
 *
 * Les prix sont mes estimations pour Douala. Le seul point de mesure réel dont
 * on dispose est une annonce PUOL à 16 500 FCFA la nuit pour une chambre
 * meublée à Carrefour Andem. Tout le reste est plausible, pas vérifié.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

// Rôle de service : on crée des comptes et on contourne RLS. C'est un script
// d'administration local, jamais du code applicatif.
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const purger = process.argv.includes('--purge');

// --- Propriétaires de démonstration -----------------------------------------
const PROPRIETAIRES = [
  { email: 'demo.owner1@doualastays.local', nom: 'Awono Célestine' },
  { email: 'demo.owner2@doualastays.local', nom: 'Ekambi Serge' },
  { email: 'demo.owner3@doualastays.local', nom: 'Ngo Bell Marthe' },
  { email: 'demo.owner4@doualastays.local', nom: 'Tchoumi Blaise' },
];

type Annonce = {
  titre: string;
  quartier: string;
  type: 'ROOM' | 'STUDIO' | 'APARTMENT' | 'VILLA';
  prix: number;
  personnes: number;
  repere: string;
  equipements: string[];
  description: string;
  adresse: string;
  telephone: string;
};

/**
 * Fourchettes de prix retenues, en FCFA la nuit — mes estimations :
 *   chambre      8 000 – 20 000   (repère réel : PUOL, 16 500 à Carrefour Andem)
 *   studio      15 000 – 35 000
 *   appartement 30 000 – 70 000
 *   villa       70 000 – 150 000
 */
const ANNONCES: Annonce[] = [
  {
    titre: 'Chambre meublée calme à Bepanda',
    quartier: 'Bepanda', type: 'ROOM', prix: 12000, personnes: 2,
    repere: 'derrière le marché Tapis Rouge',
    equipements: ['WIFI', 'WATER_HEATER'],
    description: "Chambre simple et propre, dans une concession calme. Lit deux places, armoire, ventilateur. Salle d'eau privée avec chauffe-eau. Boutique et taxi à deux minutes à pied.",
    adresse: 'Rue des Manguiers, concession Ebong, porte 4', telephone: '+237 6 91 00 00 01',
  },
  {
    titre: 'Chambre climatisée près du carrefour Andem',
    quartier: 'Carrefour Andem', type: 'ROOM', prix: 16500, personnes: 2,
    repere: 'en bord de route, face à la pharmacie',
    equipements: ['AC', 'WIFI', 'TV', 'WATER_HEATER'],
    description: 'Chambre meublée avec climatisation, dans un immeuble en bord de route. Accès facile en taxi de nuit comme de jour. Convient pour un séjour court.',
    adresse: 'Boulevard principal, immeuble Sanaga, 2e étage', telephone: '+237 6 91 00 00 02',
  },
  {
    titre: 'Chambre étudiante à Ndogbong',
    quartier: 'Ndogbong', type: 'ROOM', prix: 8000, personnes: 1,
    repere: 'près du carrefour Ndogbong',
    equipements: ['WIFI'],
    description: 'Petite chambre meublée, idéale pour une personne seule en séjour de moyenne durée. Douche commune. Quartier vivant, transport facile.',
    adresse: 'Rue 3.021, maison à portail vert', telephone: '+237 6 91 00 00 03',
  },
  {
    titre: 'Chambre avec cuisine à Nyalla',
    quartier: 'Nyalla', type: 'ROOM', prix: 13000, personnes: 2,
    repere: 'à 300 m du marché',
    equipements: ['WIFI', 'KITCHEN', 'WATER_HEATER'],
    description: 'Chambre meublée avec coin cuisine équipé. Permet de préparer ses repas et de réduire le budget sur un séjour de plusieurs jours.',
    adresse: 'Quartier Nyalla, rue du marché, villa beige', telephone: '+237 6 91 00 00 04',
  },
  {
    titre: 'Studio meublé à Akwa',
    quartier: 'Akwa', type: 'STUDIO', prix: 28000, personnes: 2,
    repere: 'à 5 minutes de la rue Joss',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'WATER_HEATER'],
    description: "Studio en plein centre, à distance de marche des banques, restaurants et administrations. Climatisation, kitchenette équipée, eau chaude. Convient à un déplacement professionnel.",
    adresse: 'Rue Kitchener, immeuble Wouri, appartement 12', telephone: '+237 6 91 00 00 05',
  },
  {
    titre: 'Studio climatisé à Bonapriso',
    quartier: 'Bonapriso', type: 'STUDIO', prix: 35000, personnes: 2,
    repere: 'près de la boulangerie Saker',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'PARKING', 'SECURITY'],
    description: 'Studio dans une résidence gardée, quartier résidentiel calme. Parking dans la cour. Idéal pour un séjour tranquille avec accès rapide au centre.',
    adresse: 'Rue Njo-Njo, résidence Les Palmiers, studio B3', telephone: '+237 6 91 00 00 06',
  },
  {
    titre: 'Studio à Makepe avec groupe électrogène',
    quartier: 'Makepe', type: 'STUDIO', prix: 25000, personnes: 2,
    repere: 'vers Makepe Missoké',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'GENERATOR', 'WATER_HEATER'],
    description: "Studio équipé d'un groupe électrogène : pas de coupure de courant pendant votre séjour. Kitchenette complète, eau chaude, climatisation.",
    adresse: 'Makepe Missoké, rue 4.108, immeuble crème', telephone: '+237 6 91 00 00 07',
  },
  {
    titre: 'Studio à Bonamoussadi',
    quartier: 'Bonamoussadi', type: 'STUDIO', prix: 22000, personnes: 2,
    repere: 'à 200 m du carrefour Kotto',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV'],
    description: 'Studio meublé dans un quartier commerçant et bien desservi. Supermarché, pharmacie et restaurants à proximité immédiate.',
    adresse: 'Rue Bonamoussadi 12, immeuble Espoir, 1er étage', telephone: '+237 6 91 00 00 08',
  },
  {
    titre: 'Studio à Deido, proche du fleuve',
    quartier: 'Deido', type: 'STUDIO', prix: 19000, personnes: 2,
    repere: 'quartier Deido, près du pont',
    equipements: ['WIFI', 'KITCHEN', 'TV', 'WATER_HEATER'],
    description: 'Studio simple et fonctionnel, dans un quartier historique de Douala. Bon rapport qualité-prix pour un séjour de quelques nuits.',
    adresse: 'Rue Deido 8, maison à étage bleue', telephone: '+237 6 91 00 00 09',
  },
  {
    titre: 'Studio neuf à Logpom',
    quartier: 'Logpom', type: 'STUDIO', prix: 24000, personnes: 3,
    repere: 'Logpom barrière',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'WASHING_MACHINE', 'WATER_HEATER'],
    description: 'Studio récemment construit, avec machine à laver. Quartier en développement, calme le soir, accès rapide à la route de Yaoundé.',
    adresse: 'Logpom barrière, rue 6.220, résidence Alpha', telephone: '+237 6 91 00 00 10',
  },
  {
    titre: 'Appartement 2 chambres à Bonanjo',
    quartier: 'Bonanjo', type: 'APARTMENT', prix: 55000, personnes: 4,
    repere: 'quartier administratif',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'PARKING', 'SECURITY', 'GENERATOR'],
    description: "Appartement de deux chambres dans le quartier administratif, à proximité des ministères et des sièges d'entreprises. Gardiennage 24h, groupe électrogène, parking.",
    adresse: 'Avenue de Gaulle, immeuble Bonanjo Center, appartement 402', telephone: '+237 6 91 00 00 11',
  },
  {
    titre: 'Appartement familial à Bonamoussadi',
    quartier: 'Bonamoussadi', type: 'APARTMENT', prix: 42000, personnes: 5,
    repere: 'près du rond-point Denver',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'PARKING', 'WASHING_MACHINE'],
    description: "Appartement spacieux de trois pièces, adapté à une famille ou à un groupe. Cuisine équipée, machine à laver, place de parking. Marché et écoles à proximité.",
    adresse: 'Rond-point Denver, immeuble Les Cocotiers, 3e étage', telephone: '+237 6 91 00 00 12',
  },
  {
    titre: 'Appartement meublé à Akwa',
    quartier: 'Akwa', type: 'APARTMENT', prix: 48000, personnes: 4,
    repere: 'à deux pas de la place du Gouvernement',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'SECURITY', 'WATER_HEATER'],
    description: 'Appartement au cœur du centre-ville, dans un immeuble sécurisé. Deux chambres, salon, cuisine équipée. Tout se fait à pied depuis le logement.',
    adresse: 'Rue Franqueville, immeuble Akwa Palace annexe, appartement 7', telephone: '+237 6 91 00 00 13',
  },
  {
    titre: 'Appartement calme à Kotto',
    quartier: 'Kotto', type: 'APARTMENT', prix: 38000, personnes: 4,
    repere: 'Kotto, vers la station',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'PARKING', 'WATER_HEATER'],
    description: 'Appartement de deux chambres dans un quartier résidentiel calme, loin du bruit du centre. Parking privé. Bon choix pour un séjour de plusieurs semaines.',
    adresse: 'Kotto, rue 5.412, résidence Sainte-Anne', telephone: '+237 6 91 00 00 14',
  },
  {
    titre: 'Appartement à Bonaberi',
    quartier: 'Bonaberi', type: 'APARTMENT', prix: 32000, personnes: 4,
    repere: 'après le pont, vers Bonassama',
    equipements: ['WIFI', 'KITCHEN', 'TV', 'PARKING'],
    description: "Appartement de l'autre côté du Wouri, moins cher que le centre. Deux chambres, parking. À prévoir : la circulation sur le pont aux heures de pointe.",
    adresse: 'Bonassama, rue de la Chapelle, immeuble jaune', telephone: '+237 6 91 00 00 15',
  },
  {
    titre: 'Villa avec cour à Bonapriso',
    quartier: 'Bonapriso', type: 'VILLA', prix: 95000, personnes: 6,
    repere: 'quartier résidentiel, rue calme',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'TV', 'PARKING', 'SECURITY', 'GENERATOR', 'WASHING_MACHINE'],
    description: "Villa de trois chambres avec cour privée et gardiennage. Groupe électrogène, climatisation dans toutes les pièces. Convient à une famille ou à une délégation professionnelle.",
    adresse: 'Rue des Cocotiers, villa 14, portail marron', telephone: '+237 6 91 00 00 16',
  },
  {
    titre: 'Villa à Logbessou',
    quartier: 'Logbessou', type: 'VILLA', prix: 75000, personnes: 6,
    repere: 'Logbessou, route de Yaoundé',
    equipements: ['AC', 'WIFI', 'KITCHEN', 'PARKING', 'SECURITY', 'GENERATOR'],
    description: 'Villa récente de trois chambres, dans un lotissement gardé. Grande cour, parking pour deux véhicules. Sortie rapide vers la route de Yaoundé.',
    adresse: 'Cité Logbessou, lot 27', telephone: '+237 6 91 00 00 17',
  },
  {
    titre: 'Chambre simple à Bali',
    quartier: 'Bali', type: 'ROOM', prix: 10000, personnes: 1,
    repere: 'quartier Bali, près du lycée',
    equipements: ['WIFI', 'WATER_HEATER'],
    description: 'Chambre meublée dans un quartier central et animé. Restaurants et commerces à toute heure. Solution économique pour un séjour court.',
    adresse: 'Rue Bali 22, maison à véranda', telephone: '+237 6 91 00 00 18',
  },
];

async function purge(): Promise<void> {
  console.log('→ purge des donnees de demonstration');

  const { data: listings } = await db.from('listings').select('id').eq('is_demo', true);
  console.log(`  ${listings?.length ?? 0} annonce(s) marquee(s)`);

  // Les blocages et les photos partent en cascade ; les réservations, non
  // (clé en restriction). On les retire d'abord, sinon la suppression échoue
  // dès qu'une annonce a la moindre demande.
  if (listings?.length) {
    const ids = listings.map((l) => l.id);
    await db.from('bookings').delete().in('listing_id', ids);
    await db.from('listings').delete().in('id', ids);
  }

  const { data: profils } = await db.from('profiles').select('id').eq('is_demo', true);
  if (profils?.length) {
    for (const p of profils) await db.auth.admin.deleteUser(p.id);
    console.log(`  ${profils.length} compte(s) supprime(s)`);
  }

  console.log('  purge terminee');
}

async function semer(): Promise<void> {
  // --- Propriétaires ---
  console.log('→ proprietaires');
  const idsProprietaires: string[] = [];

  for (const p of PROPRIETAIRES) {
    const { data, error } = await db.auth.admin.createUser({
      email: p.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { full_name: p.nom },
    });

    if (error || !data.user) {
      // Déjà créé lors d'un passage précédent : on le retrouve par email.
      const { data: liste } = await db.auth.admin.listUsers();
      const existant = liste?.users.find((u) => u.email === p.email);
      if (!existant) {
        console.error(`  ECHEC ${p.email} : ${error?.message}`);
        continue;
      }
      idsProprietaires.push(existant.id);
    } else {
      idsProprietaires.push(data.user.id);
    }

    const id = idsProprietaires.at(-1)!;
    await db
      .from('profiles')
      .update({ role: 'OWNER', full_name: p.nom, is_approved: true, is_demo: true })
      .eq('id', id);
    console.log(`  ${p.nom}`);
  }

  if (idsProprietaires.length === 0) {
    console.error('Aucun proprietaire disponible, arret.');
    process.exit(1);
  }

  // --- Quartiers ---
  const { data: quartiers } = await db.from('neighborhoods').select('id, name');
  const parNom = new Map((quartiers ?? []).map((q) => [q.name, q.id]));

  // --- Annonces ---
  console.log('\n→ annonces');
  let creees = 0;
  let ignorees = 0;

  for (const [i, a] of ANNONCES.entries()) {
    const quartierId = parNom.get(a.quartier);
    if (!quartierId) {
      // On le DIT plutôt que de rattacher au hasard : une annonce dans le
      // mauvais quartier fausserait toute mesure de l'agent.
      console.error(`  IGNOREE « ${a.titre} » : quartier « ${a.quartier} » absent du referentiel`);
      ignorees += 1;
      continue;
    }

    const { data: existante } = await db
      .from('listings')
      .select('id')
      .eq('title', a.titre)
      .eq('is_demo', true)
      .maybeSingle();

    if (existante) {
      console.log(`  deja presente : ${a.titre}`);
      continue;
    }

    const { data: listing, error } = await db
      .from('listings')
      .insert({
        owner_id: idsProprietaires[i % idsProprietaires.length]!,
        neighborhood_id: quartierId,
        title: a.titre,
        description: a.description,
        landmark: a.repere,
        price_per_night: a.prix,
        listing_type: a.type,
        max_guests: a.personnes,
        amenities: a.equipements,
        // INACTIVE : la publication reste refusée sans photo, et c'est au
        // fondateur d'ajouter les images puis de publier. Le seed ne
        // court-circuite pas cette règle.
        is_active: false,
        is_demo: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  ECHEC « ${a.titre} » : ${error.message}`);
      continue;
    }

    await db.from('listing_contacts').insert({
      listing_id: listing.id,
      exact_address: a.adresse,
      contact_phone: a.telephone,
      access_notes: null,
    });

    creees += 1;
    console.log(`  ${a.titre.padEnd(48)} ${a.prix.toLocaleString('fr-FR')} FCFA`);
  }

  console.log(`\n${creees} annonce(s) creee(s), ${ignorees} ignoree(s).`);
  console.log('Toutes sont EN BROUILLON : ajoutez les photos puis publiez depuis /admin/listings.');
}

await (purger ? purge() : semer());
