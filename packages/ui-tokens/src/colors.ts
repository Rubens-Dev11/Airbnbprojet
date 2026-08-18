/**
 * Palette — source unique de vérité pour les couleurs.
 *
 * Décision et justification : docs/memory/decisions/ADR-006-identite-visuelle.md
 * Dérivée du visuel de marque XENOS itech (violet / noir / blanc / gris).
 *
 * AVERTISSEMENT — ces valeurs sont une LECTURE du visuel fourni, pas un
 * échantillonnage de ses pixels : l'image a été transmise en conversation, pas
 * déposée dans le dépôt. Les ratios de contraste ci-dessous, eux, sont
 * calculés selon la formule de luminance relative WCAG et sont exacts pour ces
 * valeurs-là. Si une charte XENOS existe, remplacer les valeurs ici : c'est le
 * seul endroit à modifier.
 *
 * Aucune couleur ne doit être écrite en dur ailleurs dans le monorepo.
 */

export const colors = {
  /** Couleur primaire : boutons, liens, éléments actifs. */
  violet: {
    50: '#F8F4FC',
    100: '#EFE7F7',
    200: '#DDCBEF',
    300: '#C4A9E4',
    400: '#A97FD6',
    500: '#8B4CC4',
    600: '#7038A8',
    /** Primaire. Contraste 9,4:1 sur blanc et 8,4:1 sur `paper` — AAA. */
    700: '#5D2E8C',
    800: '#4F2270',
    900: '#3D1A52',
  },

  /**
   * Accent : badges, mises en avant, dégradé du logo.
   * Contraste 5,7:1 sur blanc — AA en texte normal, AAA en grand.
   * NE PAS utiliser pour du texte courant.
   */
  magenta: {
    500: '#B02A9D',
  },

  /** Texte. `ink900` sur blanc : 19,0:1 — AAA. */
  ink: {
    700: '#2E2E2E',
    900: '#111111',
  },

  gray: {
    100: '#EDEDED',
    300: '#D4D4D4',
    500: '#6B6B6B',
  },

  /** Fond d'application — le blanc cassé texturé du visuel de marque. */
  paper: '#F4F2F3',
  white: '#FFFFFF',
} as const;

/**
 * Dégradé de marque, orienté haut-gauche vers bas-droite comme le logo.
 * RÉSERVÉ à l'identité : logo, écran d'accueil, en-têtes de marque.
 * Jamais sous un libellé de bouton — le contraste y devient imprévisible.
 */
export const brandGradient = {
  from: colors.magenta[500],
  to: colors.violet[700],
  angle: 135,
} as const;

export type Colors = typeof colors;
