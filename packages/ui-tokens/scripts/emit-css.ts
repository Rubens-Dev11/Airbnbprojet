/**
 * Génère les variables CSS Tailwind depuis les jetons TypeScript.
 *
 *   pnpm tokens:css
 *
 * Pourquoi générer plutôt que recopier : ADR-006 impose une source unique des
 * couleurs, parce que la palette est PROVISOIRE — XENOS itech est la structure,
 * pas la marque du produit. Le jour où la marque change, un seul fichier bouge.
 * Une palette recopiée à la main dans du CSS diverge en trois semaines.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colors } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, '..', '..', '..', 'apps', 'web', 'src', 'app', 'tokens.generated.css');

const lines: string[] = [
  '/* FICHIER GÉNÉRÉ — ne pas éditer.',
  ' * Source : packages/ui-tokens/src/colors.ts',
  ' * Régénérer : pnpm tokens:css',
  ' * Décision : docs/memory/decisions/ADR-006-identite-visuelle.md',
  ' */',
  '@theme {',
];

// `violet` est exposé sous le nom `brand` côté interface : le jour où la
// marque produit sera définie, les classes du code (bg-brand-700) n'auront pas
// à changer, seule la valeur bougera.
for (const [shade, value] of Object.entries(colors.violet)) {
  lines.push(`  --color-brand-${shade}: ${value};`);
}
for (const [shade, value] of Object.entries(colors.magenta)) {
  lines.push(`  --color-accent-${shade}: ${value};`);
}
for (const [shade, value] of Object.entries(colors.ink)) {
  lines.push(`  --color-ink-${shade}: ${value};`);
}
for (const [shade, value] of Object.entries(colors.gray)) {
  lines.push(`  --color-gray-${shade}: ${value};`);
}
lines.push(`  --color-paper: ${colors.paper};`);
lines.push('}');
lines.push('');

writeFileSync(target, lines.join('\n'), 'utf8');
console.log(`ecrit : ${target} (${lines.length} lignes)`);
