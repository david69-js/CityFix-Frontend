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
  adminHighlight: string;
  workerHighlight: string;
};

export const lightColors: ThemeColors = {
  primary: '#364461', // Color 5: Dark Blue/Navy
  background: '#FFFFFF', // Keeping it white as requested
  surface: '#FFFFFF',
  textTitle: '#364461', // Navy for titles
  textSub: '#4d686f', // Teal for subtext
  textLight: '#6d756a', // Sage for light text
  border: '#6d756a', // Sage for borders
  danger: '#C0392B', // Darker red to match

  statBgBlue: '#EBF5FB',
  statTextBlue: '#4d686f',
  statBgGreen: '#F0FDF4',
  statTextGreen: '#16A34A',
  statBgPurple: '#FAF5FF',
  statTextPurple: '#9333EA',
  statBgOrange: '#FEF9E7',
  statTextOrange: '#bfa374',

  orangeHero: '#e3ba6a', // Color 1: Gold
  blueInfluencer: '#4d686f',
  greySuper: '#6d756a',

  badgeYellowBg: '#e3ba6a',
  badgeYellowText: '#364461',
  badgeBlueBg: '#D6EAF8',
  badgeBlueText: '#4d686f',
  badgeGreyBg: '#F3F4F6',
  badgeGreyText: '#9CA3AF',

  iconOrangeBg: '#FEF9E7',
  iconOrangeFg: '#bfa374', // Color 2: Sand
  iconBlueBg: '#EBF5FB',
  iconBlueFg: '#4d686f', // Color 4: Teal
  iconGreenBg: '#ECFDF5',
  iconGreenFg: '#10B981',

  tagDefaultBg: '#4d686f',
  tagGarbageBg: '#e3ba6a',
  tagRoadsBg: '#364461',
  tagLightingBg: '#bfa374',
  tagWaterBg: '#4d686f',

  workerGreen: '#10B981',

  statusProgressBg: '#EBF5FB',
  statusProgressFg: '#4d686f',
  buttonBlueBg: '#D6EAF8',
  buttonBlueText: '#364461', 
  timelineLine: '#6d756a',
  orangeDot: '#e3ba6a',
  blueDot: '#4d686f',

  unreadBg: '#EBF5FB',
  adminHighlight: '#4d686f', // Teal for Admin
  workerHighlight: '#6d756a', // Sage for Worker
};

export const darkColors: ThemeColors = {
  primary: '#364461', // Back to Navy (less overwhelming for large areas)
  background: '#151C2C', 
  surface: '#1E2738', 
  textTitle: '#FFFFFF', 
  textSub: '#bfa374', 
  textLight: '#6d756a', 
  border: '#364461', 
  danger: '#EC7063', 

  statBgBlue: '#1B263B',
  statTextBlue: '#4d686f',
  statBgGreen: '#0E2F26',
  statTextGreen: '#34D399',
  statBgPurple: '#2A1B3D',
  statTextPurple: '#C084FC',
  statBgOrange: '#2C2314',
  statTextOrange: '#e3ba6a',

  orangeHero: '#e3ba6a',
  blueInfluencer: '#4d686f',
  greySuper: '#6d756a',

  badgeYellowBg: '#2C2314',
  badgeYellowText: '#e3ba6a',
  badgeBlueBg: '#1B263B',
  badgeBlueText: '#4d686f',
  badgeGreyBg: '#243048',
  badgeGreyText: '#6d756a',

  iconOrangeBg: '#2C2314',
  iconOrangeFg: '#e3ba6a',
  iconBlueBg: '#1B263B',
  iconBlueFg: '#4d686f',
  iconGreenBg: '#0E2F26',
  iconGreenFg: '#34D399',

  tagDefaultBg: '#364461',
  tagGarbageBg: '#e3ba6a',
  tagRoadsBg: '#364461',
  tagLightingBg: '#bfa374',
  tagWaterBg: '#4d686f',

  workerGreen: '#6d756a', // Sage as requested for assignments

  statusProgressBg: '#1B263B',
  statusProgressFg: '#4d686f',
  buttonBlueBg: '#1B263B',
  buttonBlueText: '#e3ba6a', 
  timelineLine: '#364461',
  orangeDot: '#e3ba6a',
  blueDot: '#4d686f',

  unreadBg: '#1B263B',
  adminHighlight: '#4d686f', // Teal for Admin
  workerHighlight: '#6d756a', // Sage for Worker
};
