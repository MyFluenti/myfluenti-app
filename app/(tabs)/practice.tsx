import { useRouter } from 'expo-router';

import { Button, NoReviewState, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useReviewQueue } from '@/features/review/useReviewQueue';

export default function PracticeScreen() {
  const router = useRouter();
  const state = useReviewQueue();

  return (
    <Screen state={state}>
      {(queue) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Revisão
          </Text>
          {queue.due_count === 0 ? (
            <NoReviewState onGoToCourse={() => router.navigate('/course')} />
          ) : (
            <>
              <Text variant="bodyL" color="textSecondary">
                {queue.due_count === 1 ? '1 item para hoje' : `${queue.due_count} itens para hoje`}
              </Text>
              {/* TODO: iniciar a sessão de revisão (start_review_session). */}
              <Button label="Começar revisão" disabled />
            </>
          )}
        </>
      )}
    </Screen>
  );
}
