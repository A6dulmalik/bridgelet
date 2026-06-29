import { useTheme } from '../providers/ThemeProvider';
import { Colors } from '../constants/Colors';

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? Colors.dark : Colors.light;
}
