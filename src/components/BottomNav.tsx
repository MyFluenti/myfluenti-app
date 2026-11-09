import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';

import { colors, layout, spacing } from '@/theme/tokens';

import { Icon, type IconName } from './icons';
import { Text } from './Text';

export type BottomNavItem = {
  key: string;
  label: string;
  icon: IconName;
};

/** Itens oficiais do menu inferior: Início, Curso, Biblioteca, Revisão, Perfil. */
export const bottomNavItems: readonly BottomNavItem[] = [
  { key: 'index', label: 'Início', icon: 'home' },
  { key: 'course', label: 'Curso', icon: 'course' },
  { key: 'library', label: 'Biblioteca', icon: 'library' },
  { key: 'practice', label: 'Revisão', icon: 'review' },
  { key: 'profile', label: 'Perfil', icon: 'profile' },
];

export type BottomNavProps = {
  items?: readonly BottomNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** Área segura inferior. Se omitido, usa useSafeAreaInsets. */
  insetBottom?: number;
};

export function BottomNav({ items = bottomNavItems, activeKey, onSelect, insetBottom }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const bottom = insetBottom ?? insets.bottom;

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { height: layout.bottomNavHeight + bottom, paddingBottom: bottom }]}
    >
      {items.map((item, index) => {
        const active = item.key === activeKey;
        const color = active ? 'brandPrimaryLight' : 'textSecondary';
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityHint={`Aba ${index + 1} de ${items.length}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.key)}
            style={styles.item}
          >
            <Icon name={item.icon} color={color} />
            <Text variant="caption" color={color}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Adaptador para a prop `tabBar` do Tabs do Expo Router:
 * `<Tabs tabBar={(props) => <BottomNavTabBar {...props} />} />`
 * Rotas esperadas: index, course, library, practice, profile. Rotas com href null ficam ocultas.
 */
export function BottomNavTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const visible = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => (descriptors[route.key]?.options as { href?: unknown } | undefined)?.href !== null);

  const items: BottomNavItem[] = visible.map(({ route, index }) => {
    const known = bottomNavItems.find((i) => i.key === route.name);
    const title = descriptors[route.key]?.options.title;
    return {
      key: route.key,
      label: known?.label ?? title ?? route.name,
      icon: known?.icon ?? bottomNavItems[index]?.icon ?? 'home',
    };
  });

  const activeKey = state.routes[state.index]?.key ?? '';

  const handleSelect = (routeKey: string) => {
    const event = emitter.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
    if (routeKey !== activeKey && !event.defaultPrevented) {
      navigateToTab(routeKey);
    }
  };

  return <BottomNav items={items} activeKey={activeKey} onSelect={handleSelect} insetBottom={insets.bottom} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  item: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
