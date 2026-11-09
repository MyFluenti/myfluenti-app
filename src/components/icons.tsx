import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, layout, type ColorToken } from '@/theme/tokens';

export type IconName =
  | 'home'
  | 'course'
  | 'library'
  | 'review'
  | 'profile'
  | 'check'
  | 'close'
  | 'lock'
  | 'arrow-left'
  | 'chevron-right';

export type IconProps = {
  name: IconName;
  /** Token de cor do traço. Padrão: textPrimary. */
  color?: ColorToken;
  /** Tamanho em px. Padrão: layout.iconSize. */
  size?: number;
};

// Ícones lineares, traço 2, cantos arredondados, viewBox 24 x 24.
export function Icon({ name, color = 'textPrimary', size = layout.iconSize }: IconProps) {
  const stroke = colors[color];
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
    >
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={layout.iconStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'home' && <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'course' && (
        <>
          <Path d="M2 5.5C4 4.5 8 4.5 12 6.5c4-2 8-2 10-1V19c-2-1-6-1-10 1-4-2-8-2-10-1z" />
          <Path d="M12 6.5V20" />
        </>
      )}
      {name === 'library' && (
        <>
          <Path d="M4 4h5v16H4z" />
          <Path d="M11 4h5v16h-5z" />
          <Path d="m18.5 5.5 2.5.8-3.5 13.2-2.5-.8z" />
        </>
      )}
      {name === 'review' && (
        <>
          <Path d="m17 2 4 4-4 4" />
          <Path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <Path d="m7 22-4-4 4-4" />
          <Path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </>
      )}
      {name === 'profile' && (
        <>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </>
      )}
      {name === 'check' && <Path d="m5 12.5 4.5 4.5L19 7.5" />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" />}
      {name === 'lock' && (
        <>
          <Rect x={5} y={11} width={14} height={10} rx={2} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      )}
      {name === 'arrow-left' && <Path d="M19 12H5M12 5l-7 7 7 7" />}
      {name === 'chevron-right' && <Path d="M9 18l6-6-6-6" />}
    </Svg>
    </View>
  );
}
