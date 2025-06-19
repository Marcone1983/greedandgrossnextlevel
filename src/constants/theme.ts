import { extendTheme } from 'native-base';

export const colors = {
  primary: '#1B5E20',
  secondary: '#FFD700',
  accent: '#4CAF50',
  background: '#0D1117',
  surface: '#161B22',
  text: '#E1E4E8',
  textSecondary: '#8B949E',
  error: '#F85149',
  success: '#56D364',
  warning: '#E3B341',
  info: '#58A6FF',
  border: '#30363D',
  gradientStart: '#1B5E20',
  gradientEnd: '#2E7D32',
  gold: '#FFD700',
  darkGreen: '#0D3D0D',
};

export const theme = extendTheme({
  colors: {
    primary: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: colors.primary,
      600: '#388E3C',
      700: '#2E7D32',
      800: '#1B5E20',
      900: '#0D3D0D',
    },
    secondary: {
      50: '#FFFEF7',
      100: '#FFFCE8',
      200: '#FFF9C4',
      300: '#FFF59D',
      400: '#FFEE58',
      500: colors.secondary,
      600: '#FDD835',
      700: '#FBC02D',
      800: '#F9A825',
      900: '#F57F17',
    },
    gray: {
      50: '#F0F2F5',
      100: '#E1E4E8',
      200: '#C9D1D9',
      300: '#B1BAC4',
      400: '#8B949E',
      500: '#6E7681',
      600: '#484F58',
      700: '#30363D',
      800: '#161B22',
      900: '#0D1117',
    },
  },
  fonts: {
    heading: 'Orbitron-Bold',
    body: 'Roboto',
    mono: 'Roboto',
  },
  fontSizes: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      baseStyle: {
        rounded: 'lg',
      },
    },
    Input: {
      defaultProps: {
        size: 'lg',
      },
      baseStyle: {
        color: colors.text,
        borderColor: colors.border,
        _focus: {
          borderColor: colors.primary,
        },
      },
    },
    Text: {
      baseStyle: {
        color: colors.text,
      },
    },
    Heading: {
      baseStyle: {
        color: colors.text,
        fontFamily: 'Orbitron-Bold',
      },
    },
  },
  config: {
    initialColorMode: 'dark',
  },
});

export const gradients = {
  primary: [colors.gradientStart, colors.gradientEnd],
  gold: ['#FFD700', '#FFA000'],
  dark: ['#0D1117', '#161B22'],
  success: ['#2EA043', '#56D364'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
};