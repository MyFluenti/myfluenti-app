# myfluenti-app

App mobile do MyFluenti (Android e iOS): React Native, Expo, TypeScript e Expo Router.

Slogan: *Understand. Practice. Evolve.*

## Estado

Repositório inicial. Ainda não há projeto Expo criado. Já existem:

- `src/theme/tokens.ts`: cores, espaçamento, raios e tipografia da identidade visual.
- `assets/brand/`: logotipo e ícone do app em SVG.
- `CLAUDE.md`: regras do repositório.

## Regras principais

- O app não decide regra de negócio. Tudo passa por RPCs do backend (`myfluenti-backend`).
- Só a URL e a chave anônima do Supabase ficam no app. Nunca a `service_role`.
- Cores, tamanhos e fontes vêm de `src/theme/tokens.ts`.

Veja `CLAUDE.md` e a documentação em `myfluenti-docs`.

## Como rodar

Requisitos: Node 24 e npm 11. SDK do Expo: 58.

```powershell
npm install
copy .env.example .env      # preencha URL e chave anon (nunca a service_role)
npm run gen:types           # exige o Supabase local no ar (myfluenti-backend)
npx expo start              # ou: npm run android / ios / web
```

Verificação: `npm run typecheck`, `npm run lint` e `npx expo export --platform web`.
