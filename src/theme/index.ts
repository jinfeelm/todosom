export const colors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F4',
  text: '#111111',
  textSecondary: '#6B6B6B',
  textMuted: '#A3A3A3',
  primary: '#111111',
  primarySoft: '#F0F0F0',
  accent: '#111111',
  accentSoft: '#F5F5F5',
  border: '#E8E8E8',
  borderStrong: '#D0D0D0',
  coreSeed: '#111111',
  coreSeedBg: '#F7F7F7',
  coreSeedBorder: '#111111',
  error: '#C44B4B',
  errorBg: '#FFF5F5',
  tabInactive: '#A3A3A3',
  tabActive: '#111111',
  overlay: 'rgba(0,0,0,0.45)',
  success: '#111111',
  gyeol: {
    focus: '#4A6FA5',
    create: '#C97B63',
    learn: '#6B8F71',
    breakthrough: '#D4944A',
    care: '#7BAF9E',
    connect: '#9B7BB8',
    organize: '#8C8C9A',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const fonts = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  semiBold: 'NotoSansKR_600SemiBold',
  bold: 'NotoSansKR_700Bold',
} as const;

export const typography = {
  title: { fontFamily: fonts.bold, fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  heading: { fontFamily: fonts.semiBold, fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 12, fontWeight: '400' as const, lineHeight: 17 },
  label: { fontFamily: fonts.semiBold, fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  display: { fontFamily: fonts.bold, fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
} as const;

export const touchTarget = 44;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
