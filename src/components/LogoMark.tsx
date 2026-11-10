import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export type LogoMarkProps = {
  size?: number;
};

// Mesmo desenho de assets/brand/logo-mark.svg (balão com o F recortado).
const MARK =
  'M36 8H84A28 28 0 0 1 112 36V72A28 28 0 0 1 84 100H54L26 117L31 100H36A28 28 0 0 1 8 72V36A28 28 0 0 1 36 8ZM40 28H84V41H54V49H74V61H54V80H40Z';

/** Marca do MyFluenti. Decorativa: o nome ao lado já é lido pelo leitor de tela. */
export function LogoMark({ size = 80 }: LogoMarkProps) {
  return (
    // Atributos de acessibilidade na View: no <svg> da web eles viram atributos inválidos.
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Path fillRule="evenodd" clipRule="evenodd" d={MARK} fill={colors.brandPrimary} />
      </Svg>
    </View>
  );
}
