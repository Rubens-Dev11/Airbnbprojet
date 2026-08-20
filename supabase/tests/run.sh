#!/usr/bin/env bash
# =============================================================================
# Rejoue les migrations et les tests de sécurité sur une base neuve.
#
#   pnpm db:test
#
# Utilise une image `postgres` nue plus la doublure de supabase/tests/00,
# et NON la pile Supabase complète. Motif : sur la connexion de ce poste,
# télécharger toute la pile se compte en heures ; ici le retour est en
# secondes. Ce que ça valide — schéma, contraintes, politiques RLS — est
# exactement ce qu'on veut vérifier à chaque modification.
#
# Ce que ça ne valide PAS : l'intégration réelle avec Supabase Auth, Storage
# et Realtime. Pour cela, `supabase start`.
# =============================================================================
set -euo pipefail

CONTAINER=dstest
IMAGE=postgres:16-alpine
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPA="$(dirname "$HERE")"

echo "→ base neuve ($IMAGE)"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=test -p 55432:5432 "$IMAGE" >/dev/null

for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

# La sortie est capturée AU PREMIER passage.
# La version précédente rejouait le fichier en cas d'échec pour afficher
# l'erreur — ce qui modifiait l'état de la base et affichait une erreur
# DIFFÉRENTE de la vraie (un doublon de clé au lieu de la cause initiale).
# Un outil de diagnostic qui change ce qu'il mesure envoie chercher au mauvais
# endroit. Constaté le 7 août 2026.
apply() {
  printf '  %-42s ' "$(basename "$1")"
  local out
  if out=$(docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q < "$1" 2>&1); then
    echo 'OK'
  else
    echo 'ECHEC'
    echo "$out" | head -20
    exit 1
  fi
}

echo '→ application'
apply "$HERE/00_local_shim.sql"
for m in "$SUPA"/migrations/*.sql; do apply "$m"; done
apply "$HERE/01_grants.sql"
apply "$HERE/02_fixtures.sql"

echo '→ tests de securite'
docker exec -i "$CONTAINER" psql -U postgres -q < "$HERE/03_rls_refusals.sql" 2>&1 \
  | grep -E '^ (REFUS|AUTORISE)|^NOTICE|^ERROR|^\([0-9]+ rows?\)'
code=${PIPESTATUS[0]}

docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
exit "$code"
