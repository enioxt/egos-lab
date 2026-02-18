/**
 * INTELINK Design Tokens
 * 
 * Centraliza todas as cores e estilos do sistema.
 * Baseado na home page (modelo de referência).
 */

// ============================================
// COLOR PALETTE
// ============================================

export const colors = {
  // Primary - Cyan (links, CTAs principais)
  primary: {
    50: 'rgb(236, 254, 255)',
    100: 'rgb(207, 250, 254)',
    200: 'rgb(165, 243, 252)',
    300: 'rgb(103, 232, 249)',
    400: 'rgb(34, 211, 238)',   // Main
    500: 'rgb(6, 182, 212)',
    600: 'rgb(8, 145, 178)',
    700: 'rgb(14, 116, 144)',
    800: 'rgb(21, 94, 117)',
    900: 'rgb(22, 78, 99)',
  },
  
  // Secondary - Purple (destaques, badges)
  secondary: {
    400: 'rgb(192, 132, 252)',  // Main
    500: 'rgb(168, 85, 247)',
    600: 'rgb(147, 51, 234)',
  },
  
  // Accent - Amber (alertas, warnings)
  accent: {
    400: 'rgb(251, 191, 36)',   // Main
    500: 'rgb(245, 158, 11)',
    600: 'rgb(217, 119, 6)',
  },
  
  // Success - Emerald
  success: {
    400: 'rgb(52, 211, 153)',   // Main
    500: 'rgb(16, 185, 129)',
    600: 'rgb(5, 150, 105)',
  },
  
  // Error - Red
  error: {
    400: 'rgb(248, 113, 113)',  // Main
    500: 'rgb(239, 68, 68)',
    600: 'rgb(220, 38, 38)',
  },
  
  // Background - Slate (fundos)
  background: {
    900: 'rgb(15, 23, 42)',     // Main bg
    950: 'rgb(2, 6, 23)',       // Darker
  },
  
  // Surface - Slate (cards, modais)
  surface: {
    700: 'rgb(51, 65, 85)',
    800: 'rgb(30, 41, 59)',     // Main card bg
  },
  
  // Text
  text: {
    primary: 'rgb(255, 255, 255)',
    secondary: 'rgb(203, 213, 225)', // slate-300
    muted: 'rgb(148, 163, 184)',     // slate-400
    disabled: 'rgb(100, 116, 139)',  // slate-500
  },
};

// ============================================
// TAILWIND CLASS MAPPINGS
// ============================================

export const tw = {
  // Primary
  primary: {
    bg: 'bg-cyan-500',
    bgHover: 'hover:bg-cyan-600',
    bgLight: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    textHover: 'hover:text-cyan-300',
    border: 'border-cyan-500/30',
  },
  
  // Secondary
  secondary: {
    bg: 'bg-purple-500',
    bgHover: 'hover:bg-purple-600',
    bgLight: 'bg-purple-500/10',
    text: 'text-purple-400',
    textHover: 'hover:text-purple-300',
    border: 'border-purple-500/30',
  },
  
  // Accent
  accent: {
    bg: 'bg-amber-500',
    bgHover: 'hover:bg-amber-600',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-400',
    textHover: 'hover:text-amber-300',
    border: 'border-amber-500/30',
  },
  
  // Success
  success: {
    bg: 'bg-emerald-500',
    bgHover: 'hover:bg-emerald-600',
    bgLight: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    textHover: 'hover:text-emerald-300',
    border: 'border-emerald-500/30',
  },
  
  // Error
  error: {
    bg: 'bg-red-500',
    bgHover: 'hover:bg-red-600',
    bgLight: 'bg-red-500/10',
    text: 'text-red-400',
    textHover: 'hover:text-red-300',
    border: 'border-red-500/30',
  },
  
  // Surfaces
  surface: {
    card: 'bg-slate-800/50 border border-slate-700/50',
    cardHover: 'hover:bg-slate-800/70',
    modal: 'bg-slate-900 border border-slate-700',
  },
  
  // Layout - Full Width Responsive
  layout: {
    // Container that uses full width with responsive padding
    container: 'w-full px-4 sm:px-6 lg:px-[4%] xl:px-[5%] 2xl:px-[6%]',
    // Max width for content areas that need it
    maxContent: 'max-w-screen-2xl mx-auto',
  },
};

// ============================================
// DIMENSIONS & SPACING (Fitts's Law)
// ============================================

export const dimensions = {
  // Hit Areas (min 40px)
  hitArea: {
    min: 'min-h-[40px] min-w-[40px]',
    standard: 'h-10', // 40px
    large: 'h-12',    // 48px (Touch friendly)
  },
  
  // Icon Sizes
  icon: {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  },
  
  // Spacing (4pt grid)
  spacing: {
    gap: {
      tight: 'gap-2',   // 8px
      standard: 'gap-4',// 16px
      section: 'gap-6', // 24px
      loose: 'gap-8',   // 32px
    },
    padding: {
      card: 'p-6',      // 24px
      standard: 'p-4',  // 16px
      tight: 'p-2',     // 8px
    }
  }
};

// ============================================
// ENTITY TYPE COLORS
// ============================================

export const entityColors = {
  PERSON: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  VEHICLE: {
    bg: 'bg-pink-500',
    bgLight: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
  },
  LOCATION: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  ORGANIZATION: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  FIREARM: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  PHONE: {
    bg: 'bg-cyan-500',
    bgLight: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
  },
};

// ============================================
// RELATIONSHIP TYPE ICONS
// ============================================

export const relationshipIcons = {
  criminal: '🔴',
  familiar: '👥',
  endereco: '🏠',
  veiculo: '🚗',
  financeiro: '💰',
  telefonico: '📞',
  temporal: '⏰',
};
