import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, ThemeColors } from '../theme/colors';

export const useThemeColors = (): ThemeColors => {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'dark' ? darkColors : lightColors;
};
