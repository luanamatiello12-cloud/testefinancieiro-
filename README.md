# Sistema Financeiro

Sistema de gestão financeira pessoal/empresarial, local e single-user (sem login). Monorepo com NestJS (API) + Next.js (Web) + Prisma/SQLite.

## Stack

- **apps/api** — NestJS, Clean Architecture (controllers/services/repositories/dto por módulo), Prisma
- **apps/web** — Next.js 14 (App Router), TypeScript, Tailwind, shadcn-style UI, Recharts, SWR
- **packages/database** — schema Prisma único (SQLite), migrations, seed

## Como rodar

```bash
npm install
npm run db:migrate    # cria o banco (primeira vez, pede um nome de migração)
npm run db:seed       # categorias padrão + contas iniciais
npm run dev            # sobe API (:3333) e Web (:3000) juntos
```

Acesse http://localhost:3000

## Scripts úteis

- `npm run db:studio` — abre o Prisma Studio para inspecionar o banco
- `npm run dev -w apps/api` — só a API
- `npm run dev -w apps/web` — só o front

## Clientes (foto/vídeo/captação)

Aba `/clientes` para negócio de fotografia/vídeo: cadastro de cliente, e por cliente uma lista de "trabalhos" (Foto/Vídeo/Captação) com valor a receber, vencimento, e opcionalmente terceirização (pra quem, quanto, quando pagar). Cada trabalho cria automaticamente um lançamento de receita (e de despesa, se terceirizado) no sistema — por isso tudo aparece certinho no Dashboard, Agenda e Notificações sem lógica duplicada. Apagar um trabalho remove os lançamentos vinculados e reverte o saldo se já estavam pagos.

## Estado atual (Fundação + MVP + Fase 2 + Fase 3 + Assistente IA)

Implementado: Dashboard, Lançamentos, Contas, Categorias, Cartões de crédito, Transferências, Metas financeiras, Fluxo de Caixa, Agenda financeira, Central de notificações, tema claro/escuro, busca global — ver histórico de commits/memória para detalhes de cada fase.

**Assistente de IA (chat)**: tela em `/assistente` onde você escreve em linguagem natural (“gastei 45 no mercado hoje”) e o assistente lança automaticamente. Para funcionar, cole sua chave da API do Gemini (Google AI Studio) em Configurações > Assistente de IA. Sem chave configurada, o chat responde pedindo a chave, sem quebrar. **Testado com uma chave falsa e confirmado que a chamada HTTP chega certinho na API do Gemini** (erro `API_KEY_INVALID` real do Google, não erro de código) — só falta uma chave válida para o fluxo completo funcionar de ponta a ponta.

Fora do escopo ainda: Relatórios PDF/Excel, importação OFX/CSV, conciliação bancária, tags/favoritos/lixeira/auditoria/atalhos de teclado.

**Importante:** todas as datas do sistema são tratadas como "dia puro" em UTC (sem componente de hora) tanto no backend (`apps/api/src/common/date-utils.ts`) quanto no frontend (`apps/web/lib/utils.ts`). Não usar `new Date().getDate()/.getMonth()`, `.setHours()` ou construtores locais (`new Date(y,m,d)`) para comparar com datas vindas do banco — sempre usar os helpers UTC, senão o dia fica errado para fusos negativos (ex: Brasil).

O schema do banco (`packages/database/prisma/schema.prisma`) já modela essas entidades futuras (CreditCard, Transfer, Goal, Notification, AuditLog, CostCenter) para evitar migrações destrutivas mais adiante.
