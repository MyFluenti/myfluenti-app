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
