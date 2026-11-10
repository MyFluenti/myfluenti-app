import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { DEFAULT, render } from './render';
import type { AvatarConfig } from './types';
import { isValidAvatarConfig } from './validate';

export type AvatarProps = {
  /** null ou inválida: usa o avatar padrão. */
  config: AvatarConfig | null;
  size: number;
  accessibilityLabel?: string;
  /** Sem acessibilidade própria (ex.: dentro de uma peça que já tem rótulo). */
  decorative?: boolean;
};

export function Avatar({
  config,
  size,
  accessibilityLabel = 'Seu avatar',
  decorative = false,
}: AvatarProps) {
  const cfg = isValidAvatarConfig(config) ? config : DEFAULT;
  // O recorte circular é do View (clip: false), então o SVG não precisa de id único.
  const xml = useMemo(
    () => render(cfg, size, { clip: false, label: accessibilityLabel }),
    [cfg, size, accessibilityLabel],
  );

  return (
    <View
      {...(decorative
        ? {
            accessible: false,
            accessibilityElementsHidden: true,
            importantForAccessibility: 'no-hide-descendants' as const,
          }
        : {
            accessible: true,
            accessibilityRole: 'image' as const,
            accessibilityLabel,
          })}
      style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
