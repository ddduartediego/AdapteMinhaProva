# Adapte Minha Prova

Uma aplicação web para professores adaptarem provas em PDF para alunos com necessidades especiais usando inteligência artificial.

## 🎯 Funcionalidades

- **Upload de PDF**: Envie provas em PDF (texto selecionável)
- **Análise por IA**: Identificação automática de BNCC e Bloom
- **6 Tipos de Adaptação**:
  - DI (Deficiência Intelectual)
  - TEA (Transtorno do Espectro Autista)
  - Dislexia
  - Disgrafia
  - Discalculia
  - TDAH
- **Google Docs**: Versões adaptadas criadas diretamente no Google Docs
- **Download PDF**: Exportação fácil das versões adaptadas
- **Histórico**: Repositório de provas com filtros

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Supabase
- **Auth**: Supabase Auth (Google OAuth)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **IA/Workflow**: n8n (via webhooks)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (public)/           # Páginas públicas (landing)
│   ├── (protected)/        # Páginas protegidas (dashboard)
│   ├── api/                # API Routes
│   │   ├── exams/          # CRUD de provas
│   │   ├── n8n/            # Callbacks do n8n
│   │   └── versions/       # Avaliações
│   └── auth/               # Callback OAuth
├── components/
│   ├── ui/                 # Componentes base (button, card, etc)
│   ├── exams/              # Componentes de provas
│   ├── auth/               # Componentes de autenticação
│   └── layout/             # Layouts (header, etc)
├── lib/
│   ├── supabase/           # Clientes Supabase
│   ├── n8n.ts              # Integração n8n
│   └── utils.ts            # Utilitários
├── hooks/                  # React hooks
└── types/                  # TypeScript types
```

## 🚀 Setup

### 1. Clone e instale dependências

```bash
git clone <repo>
cd adapte-minha-prova
npm install
```

### 2. Configure Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations SQL em `supabase/migrations/`
3. Configure Storage:
   - Crie um bucket privado chamado `exams`
4. Configure Auth:
   - Habilite Google OAuth
   - Configure redirect URLs

### 3. Configure variáveis de ambiente

Renomeie `env.example.txt` para `.env.local` e preencha:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# n8n Webhooks
N8N_ANALYZE_WEBHOOK_URL=https://your-n8n/webhook/analyze
N8N_GENERATE_WEBHOOK_URL=https://your-n8n/webhook/generate

# Secrets (gere valores aleatórios)
APP_TO_N8N_SECRET=your-random-secret-1
N8N_TO_APP_SECRET=your-random-secret-2
```

### 4. Execute localmente

```bash
npm run dev
```

Acesse http://localhost:3000

## 📊 Database Schema

### Tabelas

- **exams**: Provas enviadas
- **exam_questions**: Questões extraídas pela IA
- **di_answers**: Respostas corretas para DI
- **exam_versions**: Versões adaptadas
- **version_ratings**: Avaliações dos professores

### RLS (Row Level Security)

Todas as tabelas possuem RLS habilitado:
- Usuários só acessam seus próprios dados
- Service role (callbacks n8n) bypassa RLS

## 🔄 Fluxo n8n

### 1. Analyze (app → n8n)

```
POST /webhook/analyze
Headers: X-APP-SECRET
Body: { event, exam_id, user, metadata, pdf, callback }
```

### 2. Analyze Callback (n8n → app)

```
POST /api/n8n/callback
Headers: X-N8N-SECRET
Body: { event: "analyze_exam_result", bncc, bloom, extracted, reports }
```

### 3. Generate (app → n8n)

```
POST /webhook/generate
Headers: X-APP-SECRET
Body: { event, exam_id, selected_conditions, di_answers, callback }
```

### 4. Generate Callback (n8n → app)

```
POST /api/n8n/callback
Headers: X-N8N-SECRET
Body: { event: "generate_exam_versions_result", versions, qa }
```

## 📋 Estados da Prova

| Status | Descrição |
|--------|-----------|
| UPLOADED | PDF enviado |
| ANALYZING | Análise em andamento |
| WAITING_DI_INPUT | Aguardando respostas DI |
| GENERATING | Gerando versões |
| READY | Todas versões prontas |
| PARTIAL_READY | Algumas versões com limitações |
| FAILED | Erro no processamento |

## 🎨 UI Components

Baseados em [shadcn/ui](https://ui.shadcn.com):

- Button, Card, Input, Select, Checkbox
- Dialog, Dropdown, Toast
- Badge, Progress, Separator

## 🔐 Segurança

- Google OAuth via Supabase
- Middleware protege rotas `/app/*`
- RLS no banco de dados
- Secrets para comunicação app ↔ n8n
- Signed URLs para PDFs (1h de validade)

## 📦 Deploy

### Vercel (recomendado)

1. Conecte o repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Outras plataformas

Qualquer plataforma que suporte Next.js:
- Railway
- Render
- AWS Amplify

## 📄 Licença

MIT

---

Desenvolvido com ❤️ para educação inclusiva
