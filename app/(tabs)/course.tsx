import { EmptyState, Text } from '@/components';
import { Screen } from '@/features/common/Screen';
import { useCourseOverview } from '@/features/course/useCourseOverview';

export default function CourseScreen() {
  const state = useCourseOverview();

  return (
    <Screen state={state}>
      {(modules) => (
        <>
          <Text variant="display" accessibilityRole="header">
            Curso
          </Text>
          {modules.length === 0 ? (
            <EmptyState
              title="Seu curso começa pelo nivelamento"
              message="Faça o teste para descobrir por onde começar."
              actionLabel="Fazer o nivelamento"
              onAction={() => {
                // TODO: navegar para o nivelamento quando a rota existir.
              }}
            />
          ) : (
            <Text variant="bodyM" color="textSecondary">
              {modules.length} módulos neste nível.
            </Text>
          )}
        </>
      )}
    </Screen>
  );
}
