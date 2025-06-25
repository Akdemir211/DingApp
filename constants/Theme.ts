export const BaseColors = {
  primary: {
    50: '#E6EEFF',
    100: '#C2D5FF', 
    200: '#99B8FF',
    300: '#7094FF',
    400: '#476BFF',
    500: '#4169E1', // Ana mavi renk
    600: '#3451B4',
    700: '#273C87',
    800: '#1A285A',
    900: '#0D142D',
  },
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  medal: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
};

export const DarkTheme = {
  colors: {
    primary: BaseColors.primary,
    background: {
      primary: '#0F172A', // Ana arka plan
      secondary: '#1E293B', // İkincil arka plan
      tertiary: '#334155', // Üçüncül arka plan
      card: '#1E293B', // Kart arka planı
      elevated: '#334155', // Yükseltilmiş arka plan
      dark: '#0F172A',
      darker: '#020617',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      tertiary: '#94A3B8',
      inverse: '#0F172A',
      inactive: '#64748B',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: BaseColors.primary[500],
    },
    gradients: {
      primary: [BaseColors.primary[500], BaseColors.primary[400]] as const,
      background: ['#0F172A', '#1E293B'] as const,
      card: ['#1E293B', '#334155'] as const,
      accent: [BaseColors.primary[500], '#7C3AED'] as const,
      dark: ['#0F172A', '#1E293B'] as const,
      purple: ['#8B5CF6', '#A855F7'] as const,
      blue: ['#3B82F6', '#1D4ED8'] as const,
      green: ['#10B981', '#059669'] as const,
      warmDark: ['#1E293B', '#334155'] as const,
      coolDark: ['#1A202C', '#2D3748'] as const,
    },
    success: BaseColors.success,
    warning: BaseColors.warning,
    error: BaseColors.error,
    medal: BaseColors.medal,
    darkGray: BaseColors.gray,
  },
};

export const LightTheme = {
  colors: {
    primary: BaseColors.primary,
    background: {
      primary: '#FFFFFF', // Ana arka plan
      secondary: '#F0F8FF', // Açık mavi tonu
      tertiary: '#E6F3FF', // Daha açık mavi tonu
      card: '#FFFFFF', // Kart arka planı
      elevated: '#F0F8FF', // Yükseltilmiş arka plan - açık mavi
      dark: '#FFFFFF',
      darker: '#F8FBFF', // Çok açık mavi ton
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
      inverse: '#FFFFFF',
      inactive: '#94A3B8',
    },
    border: {
      primary: '#D1E7FF', // Açık mavi border
      secondary: '#B3D9FF', // Daha koyu açık mavi border
      focus: BaseColors.primary[500],
    },
    gradients: {
      primary: [BaseColors.primary[500], BaseColors.primary[400]] as const,
      background: ['#FFFFFF', '#F8FBFF'] as const,
      card: ['#FFFFFF', '#F0F8FF'] as const,
      accent: [BaseColors.primary[300], BaseColors.primary[200]] as const,
      dark: ['#FFFFFF', '#F8FBFF'] as const,
      purple: ['#E6E6FA', '#D8BFD8'] as const, // Açık mor tonları
      blue: ['#E6F3FF', '#CCE7FF'] as const, // Açık mavi tonları
      green: ['#E8F5E8', '#D4EDDA'] as const, // Açık yeşil tonları
      warmDark: ['#F0F8FF', '#E6F3FF'] as const, // Açık mavi warm tonları
      coolDark: ['#F8FBFF', '#F0F8FF'] as const, // Açık mavi cool tonları
    },
    success: BaseColors.success,
    warning: BaseColors.warning,
    error: BaseColors.error,
    medal: BaseColors.medal,
    darkGray: BaseColors.gray,
  },
};

// Backward compatibility için eski Colors export'u
export const Colors = DarkTheme.colors;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

export const Spacing = {
  xs: 3,
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 36,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  glow: {
    shadowColor: '#4169E1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  }
};

export const Animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  timing: {
    duration: 300,
  }
};

export type Theme = typeof DarkTheme;
export type ThemeColors = Theme['colors'];