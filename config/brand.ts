/**
 * Centralized brand configuration.
 * Change the brand name, colors, and identity here.
 * All components should import from this file.
 */

export const brand = {
  /** Full brand name */
  name: 'Perfect Store',

  /** Short name for compact contexts (logo, favicon) */
  shortName: 'PS',

  /** Tagline / slogan */
  tagline: 'Ghana\'s Leading Marketplace',

  /** Brand description */
  description: 'Shop quality products from trusted sellers on Perfect Store, Ghana\'s leading multi-vendor marketplace.',

  /** Social links (placeholders until official accounts exist) */
  social: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    youtube: '',
  },

  /** Contact information */
  contact: {
    email: 'support@perfectstore.com',
    phone: '+233 XX XXX XXXX',
    address: 'Accra, Ghana',
  },

  /** Color palette */
  colors: {
    /** Primary: Deep Navy / Royal Blue */
    primary: '#0f2b5b',
    primaryLight: '#1a3d7c',
    primaryDark: '#091d3f',

    /** Secondary: Rich Blue */
    secondary: '#1e40af',

    /** Accent: Vibrant Orange */
    accent: '#e85d26',
    accentLight: '#ff7a45',

    /** Deals: Warm Yellow / Amber */
    deal: '#f59e0b',
    dealDark: '#d97706',

    /** Success: Green */
    success: '#059669',

    /** Danger: Red */
    danger: '#dc2626',

    /** Neutral backgrounds */
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',

    /** Text colors */
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
  },
} as const;

/** Re-export individual values for convenience */
export const APP_NAME = brand.name;
export const APP_SHORT_NAME = brand.shortName;
export const APP_TAGLINE = brand.tagline;
export const APP_DESCRIPTION = brand.description;
