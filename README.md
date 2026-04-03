# Painel de Otimização de Campanhas

Agente de IA integrado à Meta Ads para análise de campanhas, conjuntos de anúncios e criativos. Multi-tenant.

## Setup

### 1. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

**Supabase** – em Project Settings > Database:
- **DATABASE_URL**: Connection string (URI) – use a versão "Transaction" ou "Session"
- **DIRECT_URL**: Direct connection – para migrations

**NextAuth**:
- **AUTH_SECRET**: Gere com `openssl rand -base64 32`
- **NEXTAUTH_URL**: `http://localhost:3000`

### 2. Banco de dados

Com o `.env` configurado:

```bash
npx prisma migrate deploy
```

Ou execute o SQL manualmente:
```bash
psql $DIRECT_URL -f prisma/migrations/20240308000000_init/migration.sql
```

### 3. Rodar o projeto

```bash
npm run dev
```

Acesse http://localhost:3000

## Deploy na Vercel

1. **Conecte o repositório** em [vercel.com](https://vercel.com) → New Project → importe o repositório Git.

2. **Configure as variáveis de ambiente** no painel da Vercel (Settings → Environment Variables):

   | Variável        | Descrição                                      |
   |-----------------|------------------------------------------------|
   | `DATABASE_URL`  | Connection string Supabase (modo Transaction)  |
   | `DIRECT_URL`    | Connection string Supabase (modo Session)      |
   | `AUTH_SECRET`   | `openssl rand -base64 32`                      |
   | `NEXTAUTH_URL`  | URL de produção (ex: `https://seu-app.vercel.app`) |
   | `OPENAI_API_KEY`| Chave da API OpenAI (para o chat)              |

3. **Migre o banco** antes do primeiro deploy:
   ```bash
   npx prisma migrate deploy
   ```

4. **Deploy** – a Vercel fará o build automaticamente. O script `build` já inclui `prisma generate`.

## Fluxo

1. **Login** – use qualquer email (modo demo)
2. **Organização** – selecione ou crie uma workspace
3. **Chat** – converse com o agente de IA
