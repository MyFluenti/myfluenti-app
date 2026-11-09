import { useRouter } from 'expo-router';

import { NoProgressState, Text } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { Screen } from '@/features/common/Screen';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const name = (user?.user_metadata as { display_name?: string } | undefined)?.display_name;

  return (
    <Screen>
      <Text variant="display" accessibilityRole="header">
        Início
      </Text>
      <Text variant="bodyL" color="textSecondary">
        {name ? `Olá, ${name}.` : 'Olá.'} Vamos entender o inglês, um passo de cada vez.
      </Text>
      {/* TODO: trocar pelo resumo real quando houver progresso. */}
      <NoProgressState onStart={() => router.navigate('/course')} />
    </Screen>
  );
}
