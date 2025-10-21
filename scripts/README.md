# Database Migrations

Este diretório contém os scripts SQL para criar e manter a estrutura do banco de dados no Supabase.

## Como executar as migrations

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo SQL que deseja executar
5. Clique em **Run** para executar

### Opção 2: Via Supabase CLI

```bash
# Execute a migration
supabase db push --file scripts/003_create_telegram_users_table.sql
```

## Scripts disponíveis

### 001_create_recibos_table.sql
Cria índices, políticas RLS e views para a tabela `recibos_processados`.

**Dependências:** A tabela `recibos_processados` deve existir antes de executar este script.

**Views criadas:**
- `monthly_spending_summary`: Resumo de gastos mensais
- `spending_by_type`: Gastos agrupados por tipo de estabelecimento

---

### 002_create_subscriptions_table.sql
Cria as tabelas de subscrição e features premium.

**Tabelas criadas:**
- `user_subscriptions`: Gerencia as subscrições dos usuários
- `premium_features`: Define as features disponíveis para cada plano

**Trigger:** Cria automaticamente um registro de subscrição free quando um novo usuário se registra.

---

### 003_create_telegram_users_table.sql
Cria a tabela que relaciona usuários do Supabase com IDs de chat do Telegram.

**Tabela criada:**
- `telegram_users`: Armazena o relacionamento entre `user_id` (Supabase) e `chat_id` (Telegram)

**Campos:**
- `id`: UUID único
- `user_id`: Referência ao usuário no Supabase Auth
- `chat_id`: ID do chat no Telegram (único)
- `username`: Nome de usuário do Telegram
- `first_name`: Primeiro nome
- `last_name`: Sobrenome
- `linked_at`: Data de vinculação
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

**Políticas RLS:**
- Usuários só podem ver, criar e atualizar seus próprios registros

---

## Ordem de execução

Se você está configurando o banco de dados do zero, execute os scripts nesta ordem:

1. `001_create_recibos_table.sql` (depois que a tabela `recibos_processados` existir)
2. `002_create_subscriptions_table.sql`
3. `003_create_telegram_users_table.sql`

## Notas importantes

- Todos os scripts usam `IF NOT EXISTS` ou `OR REPLACE` para serem idempotentes
- Row Level Security (RLS) está habilitado em todas as tabelas para proteger os dados dos usuários
- Os scripts criam automaticamente índices para melhorar a performance das queries
