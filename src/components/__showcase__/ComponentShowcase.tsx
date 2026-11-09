import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AnswerOption,
  Badge,
  BottomNav,
  Button,
  EmptyState,
  ErrorState,
  Input,
  LessonRow,
  LoadingState,
  ModuleCard,
  NoProgressState,
  NoReviewState,
  PremiumState,
  ProgressBar,
  Text,
} from '..';
import { colors, layout, radius, spacing } from '@/theme/tokens';

const noop = () => {};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading2" color="brandPrimaryLight">
        {title}
      </Text>
      <View style={styles.items}>{children}</View>
    </View>
  );
}

export function ComponentShowcase() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Gabriel');
  const [nav, setNav] = useState('index');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Section title="Tipografia">
        <Text variant="display">Display 28</Text>
        <Text variant="heading1">Heading 1 (24)</Text>
        <Text variant="heading2">Heading 2 (20)</Text>
        <Text variant="heading3">Heading 3 (17)</Text>
        <Text variant="button">Button (16)</Text>
        <Text variant="bodyL">Body L: she doesn&apos;t like coffee.</Text>
        <Text variant="bodyM">Body M: ela não gosta de café.</Text>
        <Text variant="label">Label 13</Text>
        <Text variant="caption" color="textSecondary">
          Caption 12
        </Text>
      </Section>

      <Section title="Button">
        <Button label="Primary" onPress={noop} />
        <Button label="Secondary" variant="secondary" onPress={noop} />
        <Button label="Outline" variant="outline" onPress={noop} />
        <Button label="Disabled" disabled onPress={noop} />
        <Button label="Loading" loading onPress={noop} />
      </Section>

      <Section title="Badge">
        <Badge variant="free" />
        <Badge variant="premium" />
        <Badge variant="completed" />
        <Badge variant="in_progress" />
      </Section>

      <Section title="AnswerOption">
        <AnswerOption label="doesn't" state="normal" onPress={noop} />
        <AnswerOption label="don't" state="selected" onPress={noop} />
        <AnswerOption label="doesn't (correta)" state="correct" disabled />
        <AnswerOption label="isn't (incorreta)" state="incorrect" disabled />
      </Section>

      <Section title="Input">
        <Input label="Vazio" placeholder="Seu nome" value="" onChangeText={noop} />
        <Input label="Foco" placeholder="Seu nome" value="" onChangeText={noop} forceFocused />
        <Input label="Preenchido" value={name} onChangeText={setName} />
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChangeText={setPassword}
        />
        <Input
          label="E-mail com erro"
          type="email"
          value="voce@"
          onChangeText={noop}
          error="Digite um e-mail válido."
        />
      </Section>

      <Section title="ProgressBar">
        <ProgressBar value={0} />
        <ProgressBar value={40} />
        <ProgressBar value={100} />
        <ProgressBar value={150} accessibilityLabel="Fora da faixa (150 vira 100)" />
        <ProgressBar value={-20} accessibilityLabel="Fora da faixa (-20 vira 0)" />
      </Section>

      <Section title="LessonRow">
        <LessonRow position={1} title="Verb to be" status="completed" onPress={noop} />
        <LessonRow position={2} title="Artigos a e an" status="in_progress" onPress={noop} />
        <LessonRow position={3} title="Plural dos substantivos" status="available" onPress={noop} />
        <LessonRow position={4} title="Pronomes pessoais" status="locked" />
      </Section>

      <Section title="ModuleCard">
        <ModuleCard
          title="Módulo 1"
          description="Primeiros passos com o verbo to be."
          status="completed"
          onPress={noop}
        />
        <ModuleCard
          title="Módulo 2"
          description="Artigos, plural e pronomes."
          status="in_progress"
          progress={40}
          onPress={noop}
        />
        <ModuleCard
          title="Módulo 3"
          description="Presente simples."
          status="available"
          onPress={noop}
        />
        <ModuleCard title="Módulo 4" description="Perguntas e negativas." status="locked" />
        <ModuleCard
          title="Módulo 5"
          description="Conversas do dia a dia."
          status="premium"
          onPress={noop}
        />
      </Section>

      <Section title="Estados globais">
        <View style={styles.box}>
          <LoadingState />
        </View>
        <View style={styles.box}>
          <LoadingState variant="spinner" />
        </View>
        <View style={styles.box}>
          <ErrorState onRetry={noop} />
        </View>
        <View style={styles.box}>
          <EmptyState
            title="Nada por aqui"
            message="Você ainda não salvou favoritos."
            actionLabel="Explorar biblioteca"
            onAction={noop}
          />
        </View>
        <View style={styles.box}>
          <NoReviewState onGoToCourse={noop} />
        </View>
        <View style={styles.box}>
          <NoProgressState onStart={noop} />
        </View>
        <View style={styles.box}>
          <PremiumState onSeePlan={noop} />
        </View>
      </Section>

      <Section title="BottomNav">
        <View style={styles.navBox}>
          <BottomNav activeKey={nav} onSelect={setNav} />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  content: {
    paddingHorizontal: layout.screenPaddingX,
    paddingVertical: spacing['3xl'],
    gap: spacing['3xl'],
  },
  section: { gap: spacing.lg },
  items: { gap: spacing.md },
  box: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  navBox: { borderRadius: radius.lg, overflow: 'hidden' },
});
