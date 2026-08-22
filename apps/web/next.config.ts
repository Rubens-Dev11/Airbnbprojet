import type { NextConfig } from 'next';

/**
 * Autorise l'optimisation des images servies par Supabase Storage.
 *
 * Sans cette entrée, `next/image` refuse le domaine et il faut passer
 * `unoptimized` — ce qui livre la photo d'origine telle quelle. Or le CDC §9
 * vise une connexion 3G et exige des images optimisées : laisser partir un
 * JPEG de 4 Mo là où 60 Ko de WebP suffisent rendrait les fiches inutilisables
 * sur le marché cible.
 *
 * Le domaine est déduit de la configuration, jamais écrit en dur : il diffère
 * entre le poste (127.0.0.1) et la production.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [];

if (supabaseUrl) {
  const { protocol, hostname, port } = new URL(supabaseUrl);
  remotePatterns.push({
    protocol: protocol.replace(':', '') as 'http' | 'https',
    hostname,
    port: port || undefined,
    pathname: '/storage/v1/object/public/**',
  });
}

/**
 * Next.js 16 refuse d'aller chercher une image sur une IP privée :
 *
 *   « hostname resolved to private IP ["127.0.0.1"] … you understand SSRF risk »
 *
 * C'est une protection légitime — sans elle, l'optimiseur d'images devient une
 * sonde vers le réseau interne du serveur. Elle ne gêne QUE le développement
 * local, où Supabase tourne sur 127.0.0.1 ; en production l'hôte est public et
 * la garde ne se déclenche pas.
 *
 * On la lève donc **uniquement en développement**. Activer ce drapeau en
 * production ouvrirait une faille SSRF réelle, et son nom le dit assez fort.
 */
const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    // AVIF d'abord, WebP en repli. Les deux pèsent nettement moins qu'un JPEG
    // à qualité équivalente — c'est ce qui rend les fiches utilisables en 3G.
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: isDevelopment,
  },
};

export default nextConfig;
