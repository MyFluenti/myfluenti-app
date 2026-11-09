import { Link } from 'expo-router';
import { useState } from 'react';

import { Badge, Button, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Screen } from '@/features/common/Screen';
import { useProfileSummary } from '@/features/profile/useProfileSummary';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const state = useProfileSummary();
  const [leaving, setLeaving] = useState(false);

  const leave = async () => {
    setLeaving(true);
    try {
      await signOut();
    } catch {
      setLeaving(false);
    }
  };

  return (
    <Screen state={state}>
      {(p) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Perfil
          </Text>
          <Text variant="heading2">{p.display_name ?? 'Sem nome'}</Text>
          <Text variant="bodyM" color="textSecondary">
            {p.email}
          </Text>
          <Text variant="bodyL">{p.current_level ? `Nível ${p.current_level.code}` : 'Sem nível'}</Text>
          <Badge variant={p.plan_tier === 'premium' ? 'premium' : 'free'} />
          <Text variant="bodyM" color="textSecondary">
            {p.progress.lessons_completed} aulas concluídas, {p.favorites_count} favoritos,{' '}
            {p.notes_count} notas
          </Text>
          <Button label="Sair" variant="secondary" onPress={leave} loading={leaving} />
          {__DEV__ ? (
            <Link href="/dev/showcase" accessibilityRole="link">
              <Text variant="caption" color="textSecondary">
                Dev: showcase de componentes
              </Text>
            </Link>
          ) : null}
        </>
      )}
    </Screen>
  );
}
