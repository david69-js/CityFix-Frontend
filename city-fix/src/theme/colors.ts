export type ThemeColors = {
  primary: string;
  background: string;
  surface: string;
  textTitle: string;
  textSub: string;
  textLight: string;
  border: string;
  danger: string;

  statBgBlue: string;
  statTextBlue: string;
  statBgGreen: string;
  statTextGreen: string;
  statBgPurple: string;
  statTextPurple: string;
  statBgOrange: string;
  statTextOrange: string;

  orangeHero: string;
  blueInfluencer: string;
  greySuper: string;

  badgeYellowBg: string;
  badgeYellowText: string;
  badgeBlueBg: string;
  badgeBlueText: string;
  badgeGreyBg: string;
  badgeGreyText: string;

  iconOrangeBg: string;
  iconOrangeFg: string;
  iconBlueBg: string;
  iconBlueFg: string;
  iconGreenBg: string;
  iconGreenFg: string;

  tagDefaultBg: string;
  tagGarbageBg: string;
  tagRoadsBg: string;
  tagLightingBg: string;
  tagWaterBg: string;

  workerGreen: string;

  statusProgressBg: string;
  statusProgressFg: string;
  buttonBlueBg: string;
  buttonBlueText: string;
  timelineLine: string;
  orangeDot: string;
  blueDot: string;

  unreadBg: string;
};

export const lightColors: ThemeColors = {
  primary: '#2065ff', // Bright blue
  background: '#F9FAFB', // Light gray background
  surface: '#FFFFFF', // White cards
  textTitle: '#111827', // Very dark gray
  textSub: '#4B5563', // Medium gray
  textLight: '#9CA3AF', // Light gray text
  border: '#E5E7EB', // Light border
  danger: '#EF4444', // Red

  statBgBlue: '#F0F9FF',
  statTextBlue: '#0284C7',
  statBgGreen: '#F0FDF4',
  statTextGreen: '#16A34A',
  statBgPurple: '#FAF5FF',
  statTextPurple: '#9333EA',
  statBgOrange: '#FFFBEB',
  statTextOrange: '#D97706',

  orangeHero: '#F59E0B',
  blueInfluencer: '#3B82F6',
  greySuper: '#E5E7EB',

  badgeYellowBg: '#FEF3C7',
  badgeYellowText: '#92400E',
  badgeBlueBg: '#DBEAFE',
  badgeBlueText: '#1E40AF',
  badgeGreyBg: '#F3F4F6',
  badgeGreyText: '#9CA3AF',

  iconOrangeBg: '#FFF2EB',
  iconOrangeFg: '#F97316',
  iconBlueBg: '#EEF4FF',
  iconBlueFg: '#3B82F6',
  iconGreenBg: '#ECFDF5',
  iconGreenFg: '#10B981',

  tagDefaultBg: '#4B5563',
  tagGarbageBg: '#F59E0B',
  tagRoadsBg: '#4B5563',
  tagLightingBg: '#EAB308',
  tagWaterBg: '#3B82F6',

  workerGreen: '#10B981',

  statusProgressBg: '#EEF4FF',
  statusProgressFg: '#3B82F6',
  buttonBlueBg: '#E0E7FF',
  buttonBlueText: '#4338CA', 
  timelineLine: '#E5E7EB',
  orangeDot: '#F97316',
  blueDot: '#3B82F6',

  unreadBg: '#EEF4FF',
};

export const darkColors: ThemeColors = {
  primary: '#3b82f6', // Slightly softer blue for dark mode
  background: '#121212', // Very dark background (Material Dark)
  surface: '#1E1E1E', // Dark cards
  textTitle: '#F9FAFB', // Almost white text
  textSub: '#D1D5DB', // Light-medium gray text
  textLight: '#9CA3AF', // Gray text
  border: '#333333', // Dark border
  danger: '#F87171', // Softer red

  statBgBlue: '#0C4A6E',
  statTextBlue: '#38BDF8',
  statBgGreen: '#064E3B',
  statTextGreen: '#34D399',
  statBgPurple: '#3B0764',
  statTextPurple: '#C084FC',
  statBgOrange: '#78350F',
  statTextOrange: '#FBBF24',

  orangeHero: '#F59E0B',
  blueInfluencer: '#3B82F6',
  greySuper: '#4B5563',

  badgeYellowBg: '#78350F',
  badgeYellowText: '#FDE68A',
  badgeBlueBg: '#1E3A8A',
  badgeBlueText: '#BFDBFE',
  badgeGreyBg: '#374151',
  badgeGreyText: '#D1D5DB',

  iconOrangeBg: '#78350F',
  iconOrangeFg: '#FBBF24',
  iconBlueBg: '#1E3A8A',
  iconBlueFg: '#93C5FD',
  iconGreenBg: '#064E3B',
  iconGreenFg: '#6EE7B7',

  tagDefaultBg: '#4B5563',
  tagGarbageBg: '#D97706',
  tagRoadsBg: '#374151',
  tagLightingBg: '#CA8A04',
  tagWaterBg: '#2563EB',

  workerGreen: '#059669', // Darker green for dark mode

  statusProgressBg: '#1E3A8A',
  statusProgressFg: '#93C5FD',
  buttonBlueBg: '#312E81',
  buttonBlueText: '#A5B4FC', 
  timelineLine: '#374151',
  orangeDot: '#D97706',
  blueDot: '#2563EB',

  unreadBg: '#1E3A8A', // Dark blue background for unread items
};
