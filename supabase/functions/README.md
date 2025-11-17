# Supabase Edge Functions

## 📋 Funções Disponíveis

### `generate-recurring-transactions`
Gera automaticamente transações baseadas em regras recorrentes (ganhos mensais, quinzenais, etc).

**Execução**: Diariamente às 00:00 UTC via cron job

---

## 🚀 Deploy

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Link com seu projeto

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Você pode encontrar o `project-ref` no dashboard do Supabase (Settings → General).

### 4. Deploy da função

```bash
# Deploy de todas as funções
supabase functions deploy

# Ou deploy de função específica
supabase functions deploy generate-recurring-transactions
```

---

## ⏰ Configurar Cron Job

### Opção 1: Via Supabase Dashboard

1. Acesse: **Database → Extensions**
2. Habilite a extensão `pg_cron`
3. Vá para **SQL Editor** e execute:

```sql
-- Cron job para rodar diariamente às 00:00 UTC
SELECT cron.schedule(
  'generate-recurring-transactions-daily',
  '0 0 * * *', -- Cron expression: midnight UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-recurring-transactions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

**Substituir**:
- `YOUR_PROJECT_REF` pelo ref do seu projeto
- `YOUR_SERVICE_ROLE_KEY` pela service role key (Settings → API)

### Opção 2: Via Supabase CLI (Recomendado)

```bash
supabase functions schedule generate-recurring-transactions --cron "0 0 * * *"
```

---

## 🧪 Testar Localmente

### 1. Servir função localmente

```bash
supabase functions serve generate-recurring-transactions --env-file .env.local
```

### 2. Chamar a função

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-recurring-transactions' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

---

## 📊 Monitorar Execuções

### Ver logs da função

```bash
supabase functions logs generate-recurring-transactions
```

### Verificar transações geradas

```sql
-- Ver últimas transações geradas
SELECT
  tg.generated_for_date,
  tg.generated_at,
  rt.description,
  ut.amount,
  ut.transaction_type
FROM transaction_generation_log tg
JOIN recurring_transactions rt ON rt.id = tg.recurring_transaction_id
JOIN user_transactions ut ON ut.id = tg.generated_transaction_id
ORDER BY tg.generated_at DESC
LIMIT 20;
```

---

## 🔧 Troubleshooting

### Função não está rodando?

1. Verificar se o cron job está ativo:
```sql
SELECT * FROM cron.job;
```

2. Verificar logs de erro do cron:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

3. Testar manualmente:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-recurring-transactions \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Permissões

Certifique-se que:
- A extensão `pg_cron` está habilitada
- A função tem acesso à `SERVICE_ROLE_KEY` (variável de ambiente)
- As tabelas têm RLS configurado corretamente

---

## 📝 Variáveis de Ambiente

As Edge Functions automaticamente têm acesso a:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

Não é necessário configurar manualmente.

---

## 🔄 Atualizar Função

Após fazer mudanças no código:

```bash
supabase functions deploy generate-recurring-transactions
```

Os logs anteriores serão preservados.
