# myfluenti-app

App mobile do MyFluenti: **React Native + Expo + TypeScript + Expo Router**. Leia também o `CLAUDE.md` da pasta mãe.

## Estrutura planejada

```
app/
  (tabs)/            index (Início), course, library, practice, profile
  lesson/  module/  vocabulary/  exercise/
src/
  components/        UI reutilizável (segue o Design System)
  features/          course, grammar, vocabulary, exercises, progress
  services/          acesso ao Supabase (única camada que fala com o backend)
  hooks/  types/  theme/  utils/
app.config.ts  eas.json  .env.example
```

## Regras

- O app **não decide regra de negócio**. Corrigir resposta, concluir aula e liberar módulo são sempre chamadas RPC (`supabase.rpc(...)`). Nada de `update` em tabelas de progresso.
- Só `src/services/` importa o cliente Supabase. Telas usam hooks de `features/`.
- Tipos do banco vêm de `supabase gen types` (arquivo gerado em `src/types/`). Não edite à mão.
- Variáveis públicas: `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Nunca use a `service_role`. Mantenha `.env.example` sem valores reais.
- Sessão persistente em armazenamento seguro (SecureStore), não em AsyncStorage puro.
- Trate os erros de acesso das RPCs: `module_locked` (módulo não liberado) e `premium_required` (plano). `premium_required` abre a tela de upgrade.
- Estados de módulo na interface: bloqueado, bloqueado por plano, disponível, em andamento, concluído.
- Estados globais obrigatórios: loading, erro de conexão, vazio, sem revisão pendente, sem progresso, conteúdo Premium.
- Tema e tokens saem de `src/theme/tokens.ts` (cores, espaçamento, raios, fontes, tipografia). Nada de cor, tamanho ou fonte solto em componente. Fontes: Manrope (títulos) e Inter (texto). Paleta e logotipo decididos (ver `myfluenti-docs/docs/marca/identidade-visual.md`).
- Logotipo e ícone ficam em `assets/brand/` (SVG). O ícone do app sai de `app-icon.svg` em PNG 1024 × 1024 sem transparência.
- Premium será limitado depois (ADR 0002): mantenha o tratamento de `premium_required`, mas não construa fluxo de compra agora.
- Acessibilidade: alvos de toque de pelo menos 44 px, contraste adequado, rótulos para leitor de tela.
- Respostas de exercício nunca mostram o gabarito antes de a RPC responder. Mostre a explicação devolvida pela RPC.

## Verificação antes de entregar

```powershell
npx tsc --noEmit
npx expo lint
```

Confirme versões do Expo SDK e comandos na documentação atual antes de atualizar dependências.
