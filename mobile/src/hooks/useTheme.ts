import { useColorScheme } from 'react-native';

import { resolveColors, ThemeColors } from '../constants/theme';
import { useSettings } from './useSettings';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ReturnType<typeof useSettings>['themeMode'];
  setThemeMode: ReturnType<typeof useSettings>['setThemeMode'];
}

export function useTheme(): UseThemeResult {
  const systemScheme = useColorScheme();
  const { themeMode, setThemeMode } = useSettings();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  return {
    colors: resolveColors(themeMode, systemScheme),
    isDark,
    themeMode,
    setThemeMode,
  };
}
