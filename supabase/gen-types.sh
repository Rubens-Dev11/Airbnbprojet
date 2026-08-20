#!/usr/bin/env bash
# =============================================================================
# Régénère packages/shared/src/database.types.ts DEPUIS LE SCHÉMA RÉEL.
#
#   pnpm db:types
#
# Monte une base neuve, applique toutes les migrations, génère les types, puis
# supprime la base. Aucune dépendance à un environnement en cours d'exécution :
# la sortie ne dépend que des fichiers de migration versionnés.
#
# Ne jamais éditer database.types.ts à la main — un type écrit à la main finit
# toujours par mentir sur ce que la base contient vraiment.
# =============================================================================
set -euo pipefail

CONTAINER=dsgen
PORT=55433
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo '→ base de reference'
cleanup
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=test -p "$PORT":5432 postgres:16-alpine >/dev/null
for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

echo '→ migrations'
docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q < "$HERE/tests/00_local_shim.sql" >/dev/null
for m in "$HERE"/migrations/*.sql; do
  printf '  %s\n' "$(basename "$m")"
  docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q < "$m" >/dev/null
done

echo '→ generation'
"$ROOT/node_modules/.bin/supabase" gen types typescript \
  --db-url "postgresql://postgres:test@127.0.0.1:$PORT/postgres" \
  --schema public \
  > "$ROOT/packages/shared/src/database.types.ts"

wc -l < "$ROOT/packages/shared/src/database.types.ts" | xargs printf '  %s lignes ecrites\n'
