/**
 * Garde-fou : vérifie que la palette respecte les contrastes annoncés dans
 * docs/memory/decisions/ADR-006-identite-visuelle.md.
 *
 * Pourquoi ce script existe : le 7 août 2026, l'ADR annonçait 19,0:1 pour
 * `ink-900` sur blanc. Le calcul réel donne 18,88:1 — l'arithmétique manuelle
 * avait pris la mauvaise branche de la formule WCAG. Un document de référence
 * qui porte un chiffre faux coûte plus cher que pas de document.
 *
 * Désormais, toute modification de la palette qui casserait un seuil
 * d'accessibilité fait échouer cette commande.
 *
 *   pnpm --filter @app/ui-tokens check:contrast
 */
import { colors } from '../src/index.ts';

/** Luminance relative d'un canal, formule WCAG 2.x. */
function channel(value8bit: number): number {
  const s = value8bit / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Seuils WCAG 2.x pour du texte de taille normale. */
const AA = 4.5;
const AAA = 7;

type Rule = {
  label: string;
  fg: string;
  bg: string;
  /** Seuil minimal exigé. Un usage "accent" se contente de AA. */
  min: number;
};

const rules: Rule[] = [
  { label: 'ink-900 sur white', fg: colors.ink[900], bg: colors.white, min: AAA },
  { label: 'ink-700 sur white', fg: colors.ink[700], bg: colors.white, min: AAA },
  { label: 'violet-700 sur white', fg: colors.violet[700], bg: colors.white, min: AAA },
  { label: 'white sur violet-700', fg: colors.white, bg: colors.violet[700], min: AAA },
  { label: 'violet-700 sur paper', fg: colors.violet[700], bg: colors.paper, min: AAA },
  { label: 'gray-500 sur white', fg: colors.gray[500], bg: colors.white, min: AA },
  // magenta-500 est un ACCENT : AA suffit, et ADR-006 interdit son usage en
  // texte courant précisément parce qu'il n'atteint pas AAA.
  { label: 'magenta-500 sur white (accent)', fg: colors.magenta[500], bg: colors.white, min: AA },
];

let failures = 0;

for (const rule of rules) {
  const ratio = contrast(rule.fg, rule.bg);
  const ok = ratio >= rule.min;
  if (!ok) failures += 1;
  const verdict = ratio >= AAA ? 'AAA' : ratio >= AA ? 'AA' : 'INSUFFISANT';
  console.log(
    `${ok ? 'OK   ' : 'ECHEC'} ${rule.label.padEnd(32)} ${ratio.toFixed(2)}:1  ` +
      `(exigé ${rule.min}:1 — ${verdict})`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} règle(s) de contraste non respectée(s). Palette refusée.`);
  process.exit(1);
}

console.log(`\n${rules.length} règles vérifiées, aucune violation.`);
