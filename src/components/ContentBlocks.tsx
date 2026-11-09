import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, layout, radius, spacing } from '@/theme/tokens';

import { Icon } from './icons';
import { Text } from './Text';

// Formato do conteúdo v1 (myfluenti-docs/docs/dados/api.md, seção 10). PROVISÓRIO.
// Tudo é validado em runtime: tipos desconhecidos e campos ausentes são ignorados.

export type ContentExample = {
  en: string;
  pt?: string;
  note?: string;
  vocabulary_example_id?: string;
};

type ContentBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'structure'; label?: string; formula?: string; examples: ContentExample[] }
  | { kind: 'tip'; text: string }
  | { kind: 'common_mistake'; wrong?: string; right?: string; note?: string }
  | { kind: 'examples'; items: ContentExample[]; divided: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function parseExample(raw: unknown): ContentExample | null {
  if (!isRecord(raw)) return null;
  const en = optText(raw.en);
  if (!en) return null;
  return {
    en,
    pt: optText(raw.pt),
    note: optText(raw.note),
    vocabulary_example_id: optText(raw.vocabulary_example_id),
  };
}

function parseExamples(raw: unknown): ContentExample[] {
  if (!Array.isArray(raw)) return [];
  const out: ContentExample[] = [];
  for (const item of raw) {
    const ex = parseExample(item);
    if (ex) out.push(ex);
  }
  return out;
}

function parseBlock(raw: unknown): ContentBlock | null {
  if (!isRecord(raw)) return null;
  switch (raw.type) {
    case 'paragraph': {
      const text = optText(raw.text);
      return text ? { kind: 'paragraph', text } : null;
    }
    case 'structure': {
      const label = optText(raw.label);
      const formula = optText(raw.formula);
      const examples = parseExamples(raw.examples);
      if (!label && !formula && examples.length === 0) return null;
      return { kind: 'structure', label, formula, examples };
    }
    case 'tip': {
      const text = optText(raw.text);
      return text ? { kind: 'tip', text } : null;
    }
    case 'common_mistake': {
      const wrong = optText(raw.wrong);
      const right = optText(raw.right);
      const note = optText(raw.note);
      if (!wrong && !right) return null;
      return { kind: 'common_mistake', wrong, right, note };
    }
    case 'comparison': {
      const items = parseExamples(raw.rows);
      return items.length > 0 ? { kind: 'examples', items, divided: true } : null;
    }
    default:
      return null; // tipo desconhecido: ignorado
  }
}

/** Converte o JSON recebido em blocos. Devolve [] se a versão ou o formato não forem reconhecidos. */
export function parseContent(content: unknown): ContentBlock[] {
  if (!isRecord(content) || content.v !== 1) return [];
  if (Array.isArray(content.blocks)) {
    const out: ContentBlock[] = [];
    for (const raw of content.blocks) {
      const block = parseBlock(raw);
      if (block) out.push(block);
    }
    return out;
  }
  if (Array.isArray(content.items)) {
    const items = parseExamples(content.items);
    return items.length > 0 ? [{ kind: 'examples', items, divided: false }] : [];
  }
  if (Array.isArray(content.rows)) {
    const items = parseExamples(content.rows);
    return items.length > 0 ? [{ kind: 'examples', items, divided: true }] : [];
  }
  return [];
}

export type ContentBlocksProps = {
  /** JSON v1 de uma seção ou tópico (`content`). Qualquer outro valor não renderiza nada. */
  content: unknown;
  /** Acessório ao lado de cada exemplo (ex.: estrela de favoritar frase com vocabulary_example_id). */
  renderItemAccessory?: (item: ContentExample) => ReactNode;
};

export function ContentBlocks({ content, renderItemAccessory }: ContentBlocksProps) {
  const blocks = parseContent(content);
  if (blocks.length === 0) return null;

  return (
    <View style={styles.root}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'paragraph':
            return (
              <Text key={index} variant="bodyL">
                {block.text}
              </Text>
            );
          case 'structure':
            return (
              <View key={index} style={styles.card}>
                {block.label ? (
                  <Text variant="caption" color="textSecondary">
                    {block.label}
                  </Text>
                ) : null}
                {block.formula ? (
                  <Text variant="heading3" color="brandPrimaryLight">
                    {block.formula}
                  </Text>
                ) : null}
                {block.examples.length > 0 ? (
                  <ExampleList items={block.examples} renderItemAccessory={renderItemAccessory} />
                ) : null}
              </View>
            );
          case 'tip':
            return (
              <View key={index} style={styles.tip} accessible accessibilityLabel={`Dica: ${block.text}`}>
                <Text variant="label" color="brandPrimaryLight">
                  Dica
                </Text>
                <Text variant="bodyM">{block.text}</Text>
              </View>
            );
          case 'common_mistake':
            return (
              <View key={index} style={styles.card}>
                {block.wrong ? (
                  <MistakeLine kind="wrong" text={block.wrong} />
                ) : null}
                {block.right ? (
                  <MistakeLine kind="right" text={block.right} />
                ) : null}
                {block.note ? (
                  <Text variant="bodyM" color="textSecondary">
                    {block.note}
                  </Text>
                ) : null}
              </View>
            );
          case 'examples':
            return (
              <ExampleList
                key={index}
                items={block.items}
                divided={block.divided}
                renderItemAccessory={renderItemAccessory}
              />
            );
        }
      })}
    </View>
  );
}

function MistakeLine({ kind, text }: { kind: 'wrong' | 'right'; text: string }) {
  const wrong = kind === 'wrong';
  const word = wrong ? 'Errado' : 'Certo';
  return (
    <View style={styles.mistakeLine} accessible accessibilityLabel={`${word}: ${text}`}>
      <Icon name={wrong ? 'close' : 'check'} color={wrong ? 'statusError' : 'statusSuccess'} size={spacing.xl} />
      <View style={styles.mistakeText}>
        <Text variant="caption" color={wrong ? 'statusError' : 'statusSuccess'}>
          {word}
        </Text>
        <Text variant="bodyL">{text}</Text>
      </View>
    </View>
  );
}

function ExampleList({
  items,
  divided = false,
  renderItemAccessory,
}: {
  items: ContentExample[];
  divided?: boolean;
  renderItemAccessory?: (item: ContentExample) => ReactNode;
}) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View
          key={index}
          style={[styles.example, divided && index > 0 && styles.exampleDivider]}
        >
          <View style={styles.exampleTexts}>
            <Text variant="heading3">{item.en}</Text>
            {item.pt ? (
              <Text variant="bodyM" color="textSecondary">
                {item.pt}
              </Text>
            ) : null}
            {item.note ? (
              <Text variant="caption" color="textSecondary">
                {item.note}
              </Text>
            ) : null}
          </View>
          {renderItemAccessory ? renderItemAccessory(item) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  card: {
    backgroundColor: colors.bgSurface,
    borderWidth: layout.borderWidth,
    borderColor: colors.borderDefault,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tip: {
    backgroundColor: colors.brandPrimarySubtle,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  mistakeLine: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  mistakeText: { flex: 1, gap: spacing.xs },
  list: { gap: spacing.md },
  example: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  exampleDivider: {
    borderTopWidth: layout.borderWidth,
    borderTopColor: colors.borderDefault,
    paddingTop: spacing.md,
  },
  exampleTexts: { flex: 1, gap: spacing.xs },
});
