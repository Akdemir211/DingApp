export const Colors = {
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
  darkGray: {
    50: '#F2F2F2',
    100: '#E6E6E6',
    200: '#CCCCCC',
    300: '#B3B3B3',
    400: '#999999',
    500: '#808080',
    600: '#666666',
    700: '#4D4D4D',
    800: '#1E2029', // Koyu arka plan
    900: '#13151C', // Daha koyu arka plan
    950: '#0D0E12', // En koyu arka plan
  },
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  background: {
    dark: '#13151C', // Ana arka plan
    darker: '#0D0E12', // Daha koyu arka plan
    card: '#1E2029', // Kart arka planı
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    inactive: '#666666',
  },
  medal: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  },
  gradients: {
    primary: ['#4169E1', '#476BFF'],
    dark: ['#13151C', '#1E2029'],
    purple: ['#8B5CF6', '#A855F7'],
    blue: ['#3B82F6', '#1D4ED8'],
    green: ['#10B981', '#059669'],
    warmDark: ['#1E2029', '#2D3748'],
    coolDark: ['#1A202C', '#2D3748'],
    accent: ['#4169E1', '#7C3AED'],
  }
};

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