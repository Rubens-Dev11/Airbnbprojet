// Extension `.ts` explicite, volontairement.
// Sans elle, `tsc` en résolution "Bundler" compile sans broncher mais Node ESM
// refuse de charger le module : le paquet passe le typecheck et reste
// inutilisable. Constaté le 2026-08-07, voir docs/journal.md.
export { colors, brandGradient } from './colors.ts';
export type { Colors } from './colors.ts';

/**
 * Ce paquet ne contient QUE les couleurs pour l'instant.
 *
 * Espacements, échelle typographique, rayons et ombres ne sont pas encore
 * décidés : ADR-006 n'a tranché que la palette. Les ajouter ici aujourd'hui
 * reviendrait à faire passer une invention pour une décision.
 *
 * Ils seront ajoutés quand une ADR les aura arrêtés.
 */
