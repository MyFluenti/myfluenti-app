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
};

export function Avatar({ config, size, accessibilityLabel = 'Seu avatar' }: AvatarProps) {
  const cfg = isValidAvatarConfig(config) ? config : DEFAULT;
  // O recorte circular é do View (clip: false), então o SVG não precisa de id único.
  const xml = useMemo(
    () => render(cfg, size, { clip: false, label: accessibilityLabel }),
    [cfg, size, accessibilityLabel],
  );

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.clip, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
