# SPECS — Adapte Minha Prova (FINAL) — Para Cursor (Claude 4.5 Opus High)
**Data:** 2026-01-12  
**Stack obrigatória:** Next.js + Supabase (Auth + DB + Storage) + n8n (IA) + Google OAuth  

---

## 0) Instruções diretas para o Cursor
Você (Cursor/Claude) deve:
1) Implementar um webapp em **Next.js (TypeScript)** seguindo estas specs.
2) Usar **Supabase** para autenticação (Google OAuth) e banco (Postgres) e Storage.
3) Integrar com **n8n** via webhooks para:
   - analisar a prova (extrair questões objetivas p/ DI, identificar BNCC/Bloom, gerar ementa se aplicável),
   - gerar versões adaptadas,
   - criar Google Docs e compartilhar com o e-mail do professor,
   - retornar links/resultados para a aplicação.
4) Não inventar features fora do escopo.
5) Entregar: código + migrations SQL + README com setup.

> Observação: o workflow do n8n em si não precisa ser implementado; apenas a integração (contratos e endpoints).

---

## 1) Objetivo do MVP (produto)
Criar um webapp B2C para professores que:
- reduz tempo/esforço para adaptar provas em PDF (texto selecionável),
- gera versões adaptadas para DI, TEA, Dislexia, Disgrafia, Discalculia, TDAH,
- identifica BNCC (habilidade) e Bloom (nível geral) via IA (n8n),
- cria Google Docs compartilhado com o e-mail do professor, com opção de exportar PDF,
- mantém histórico (repositório) com PDF original + links das versões + relatórios.

---

## 2) Requisitos funcionais (alto nível)

### 2.1 Fluxo principal
1) Usuário acessa **Landpage moderna/minimalista**
2) Usuário faz **Login com Google (OAuth via Supabase Auth)**
3) Usuário cria uma nova adaptação:
   - informa **disciplina** (obrigatório)
   - informa **ano/série** (obrigatório)
   - informa **habilidade** (opcional) (hint)
   - informa **conhecimento** (opcional) (hint/tema)
   - seleciona adaptações (DI/TEA/Dislexia/Disgrafia/Discalculia/TDAH)
   - faz upload de **PDF**
4) App envia o PDF + metadados + seleções para **n8n**
5) n8n processa:
   - identifica BNCC e Bloom,
   - (se possível) prepara relatório de ementa (se disciplina/ano/(tema) informados),
   - gera versões adaptadas e cria Google Docs compartilhado,
   - retorna dados para o app.
6) App exibe resultados:
   - 1 card por versão (condição),
   - botão “Abrir Google Docs”
   - botão “Baixar PDF” (export via Google Docs)
   - relatório BNCC/Bloom
   - ementa (se retornada)
7) App mantém histórico e permite busca por tags (disciplina/ano/habilidade).

### 2.2 Fluxo extra DI (obrigatório)
Para DI, em questões de múltipla escolha, o professor deve informar a alternativa correta (A/B/C/D…).
- A UI deve coletar essas respostas antes da geração final (ou em etapa intermediária).
- Sem isso, a versão DI pode ficar **PARTIAL** (ver fallback).

---

## 3) Guardrails (regras obrigatórias do agente IA)
O agente IA (n8n) nunca pode:
- dar a resposta no enunciado/alternativas/dicas explícitas
- trocar habilidade BNCC identificada ou o objeto de conhecimento
- reduzir Bloom além do indicado
- remover elementos essenciais do problema (imagens/situação-problema/dados essenciais)

Permitido:
- reescrever linguagem, reorganizar estrutura, separar contexto/pergunta, formatar em tópicos, destacar comandos e adaptar forma conforme condição.

> O app não implementa essas regras, mas deve exibir esses princípios em área “Como funciona / Termos”.

---

## 4) UX / Páginas

### 4.1 `/` — Landpage (pública)
- Header com logo + CTA “Entrar com Google”
- Hero: “Adapte sua prova em minutos”
- Seção “Como funciona” (3 passos)
- CTA repetido

### 4.2 `/app` — Dashboard (protegida)
- Botão “Nova adaptação”
- Lista de provas (exams) com:
  - disciplina / ano-série
  - status (ANALYZING / WAITING_DI / GENERATING / READY / PARTIAL / FAILED)
  - BNCC (se disponível)
  - Bloom (se disponível)
  - data
- Filtros:
  - disciplina (select)
  - ano/série (select)
  - habilidade (texto) (pode filtrar por bncc_code ou habilidade_hint)
  - busca livre (opcional)

### 4.3 `/app/new` — Nova adaptação (protegida)
Form:
- Disciplina (obrigatório)
- Ano/série (obrigatório)
- Habilidade (opcional) (texto)
- Conhecimento (opcional) (texto)
- Checkboxes de adaptações:
  - DI, TEA, Dislexia, Disgrafia, Discalculia, TDAH
- Upload PDF (obrigatório)
- CTA: “Enviar para adaptação”

Ao enviar:
- criar registro `exam`
- fazer upload do PDF no Storage
- iniciar processamento n8n (analyze)

Redirecionar para `/app/exams/{id}`

### 4.4 `/app/exams/{id}` — Detalhe da prova (protegida)
Mostrar:
- Metadados informados pelo professor
- Status stepper
- Seções quando disponíveis:
  - BNCC identificada (code + descrição + confiança se existir)
  - Bloom identificado (nível + confiança se existir)
  - Relatório BNCC/Bloom (texto ou JSON formatado)
  - Ementa escolar (texto retornado; se não veio, ocultar)

#### Caso status = `WAITING_DI_INPUT`
Exibir UI para professor preencher “Alternativa correta” por questão objetiva:
- Mostrar lista de questões objetivas retornadas pelo n8n:
  - número, enunciado (resumido), alternativas A/B/C/D… (se n8n retornar)
- Campo select ou radio de alternativa correta
- CTA: “Continuar e gerar versões”
Ao enviar, chamar n8n generate.

#### Caso status = `READY` ou `PARTIAL_READY`
Mostrar cards por versão:
- Condição (DI/TEA/Dislexia/Disgrafia/Discalculia/TDAH)
- Status da versão (READY/PARTIAL/FAILED)
- Botões:
  - Abrir Google Docs (link do n8n)
  - Baixar PDF (link export do Google Doc)
- Se PARTIAL:
  - Mostrar “Relatório de limitações” (lista por versão)
- Avaliação do professor (1–5) opcional + comentário opcional

---

## 5) Integração com n8n (contratos obrigatórios)

### 5.1 Visão geral
A aplicação chama o n8n por webhook. Como pode demorar, usar padrão assíncrono:
- App chama n8n → n8n responde rápido com ACK (202)
- n8n chama **callback do app** quando terminar (analyze ou generate)

**Segurança**
- App → n8n: header `X-APP-SECRET: <APP_TO_N8N_SECRET>`
- n8n → app: header `X-N8N-SECRET: <N8N_TO_APP_SECRET>`
Ambos validados no server.

### 5.2 Endpoint n8n — ANALYZE (app → n8n)
`POST {N8N_ANALYZE_WEBHOOK_URL}`

Payload JSON:
```json
{
  "event": "analyze_exam",
  "exam_id": "uuid",
  "user": { "id": "uuid", "email": "teacher@email.com" },
  "metadata": {
    "disciplina": "Matemática",
    "ano_serie": "5º ano",
    "habilidade_hint": "EF05MA07",
    "conhecimento_hint": "Frações"
  },
  "selected_conditions": ["DI", "DISLEXIA", "TDAH"],
  "pdf": {
    "storage_bucket": "exams",
    "storage_path": "userId/examId/original.pdf",
    "signed_url": "https://..."
  },
  "callback": {
    "url": "https://{APP_URL}/api/n8n/callback",
    "secret_header_name": "X-N8N-SECRET"
  }
}
````

Resposta imediata (ACK):

```json
{ "accepted": true, "exam_id": "uuid", "n8n_run_id": "string" }
```

### 5.3 Callback do ANALYZE (n8n → app)

`POST https://{APP_URL}/api/n8n/callback`

Headers:

* `X-N8N-SECRET: <N8N_TO_APP_SECRET>`

Body:

```json
{
  "event": "analyze_exam_result",
  "exam_id": "uuid",
  "status": "OK",
  "bncc": {
    "code": "EF05MA07",
    "description": "Resolver e elaborar problemas...",
    "confidence": 0.78
  },
  "bloom": {
    "level": "COMPREENDER",
    "confidence": 0.66
  },
  "reports": {
    "bncc_bloom_report_md": "### BNCC...\n### Bloom...\n",
    "ementa_report_md": "### Ementa sugerida...\n"
  },
  "extracted": {
    "objective_questions": [
      {
        "question_id": "uuid-q1",
        "order": 1,
        "prompt": "Enunciado...",
        "options": [
          { "key": "A", "text": "..." },
          { "key": "B", "text": "..." }
        ]
      }
    ]
  },
  "warnings": [
    { "code": "LOW_CONFIDENCE", "message": "..." }
  ]
}
```

**Regras pós-callback (server)**

* Persistir BNCC/Bloom/relatórios no `exams`
* Persistir `objective_questions` no `exam_questions`
* Se `selected_conditions` inclui DI e existem `objective_questions`:

  * atualizar status do exam para `WAITING_DI_INPUT`
* Caso contrário:

  * atualizar status para `READY_TO_GENERATE` e disparar `generate` automaticamente (ou permitir botão “Gerar versões”)

### 5.4 Endpoint n8n — GENERATE (app → n8n)

`POST {N8N_GENERATE_WEBHOOK_URL}`

Payload:

```json
{
  "event": "generate_exam_versions",
  "exam_id": "uuid",
  "user": { "email": "teacher@email.com" },
  "selected_conditions": ["DI", "DISLEXIA", "TDAH"],
  "metadata": { "disciplina": "...", "ano_serie": "...", "habilidade_hint": "...", "conhecimento_hint": "..." },
  "bncc": { "code": "EF05MA07", "description": "..." },
  "bloom": { "level": "COMPREENDER" },
  "di_answers": [
    { "question_id": "uuid-q1", "correct_option_key": "B" }
  ],
  "pdf": { "signed_url": "https://..." },
  "callback": { "url": "https://{APP_URL}/api/n8n/callback" }
}
```

ACK:

```json
{ "accepted": true, "exam_id": "uuid", "n8n_run_id": "string" }
```

### 5.5 Callback do GENERATE (n8n → app)

Body:

```json
{
  "event": "generate_exam_versions_result",
  "exam_id": "uuid",
  "status": "OK",
  "versions": [
    {
      "condition": "DI",
      "status": "READY",
      "google_doc_id": "docid",
      "google_doc_url": "https://docs.google.com/document/d/docid/edit",
      "limitations": []
    },
    {
      "condition": "DISLEXIA",
      "status": "PARTIAL",
      "google_doc_id": "docid2",
      "google_doc_url": "https://docs.google.com/document/d/docid2/edit",
      "limitations": [
        { "code": "MEDIA_PRESERVATION", "message": "Tabela da questão 3 foi inserida como imagem." }
      ]
    }
  ],
  "qa": {
    "status": "WARN",
    "score": 78,
    "issues": [
      { "severity": "HIGH", "code": "ANSWER_LEAK", "message": "Possível pista de resposta na questão 2." }
    ]
  }
}
```

**Regras pós-callback**

* Upsert em `exam_versions`
* Atualizar `exams.status`:

  * `READY` se todas versões READY
  * `PARTIAL_READY` se existir PARTIAL/FAILED
* Persistir QA (opcional) no exam ou por versão (preferível por versão)

### 5.6 Idempotência

Callbacks podem repetir; o server deve ser idempotente:

* Upsert por `exam_id + condition`
* Atualizar status somente se “avanço” (não regredir sem necessidade)

---

## 6) Banco de dados (Supabase Postgres) + RLS

### 6.1 Tabelas (SQL sugerido)

#### `exams`

Campos:

* `id uuid primary key default gen_random_uuid()`
* `user_id uuid not null references auth.users(id) on delete cascade`
* `disciplina text not null`
* `ano_serie text not null`
* `habilidade_hint text null`
* `conhecimento_hint text null`
* `pdf_bucket text not null`
* `pdf_path text not null`
* `bncc_code text null`
* `bncc_description text null`
* `bncc_confidence numeric null`
* `bloom_level text null`
* `bloom_confidence numeric null`
* `bncc_bloom_report_md text null`
* `ementa_report_md text null`
* `selected_conditions text[] not null`
* `status text not null default 'UPLOADED'`
* `n8n_analysis_run_id text null`
* `n8n_generate_run_id text null`
* `created_at timestamptz not null default now()`
* `updated_at timestamptz not null default now()`

#### `exam_questions`

* `id uuid primary key default gen_random_uuid()`
* `exam_id uuid not null references exams(id) on delete cascade`
* `order_index int not null`
* `prompt text not null`
* `options jsonb null` (array com keys e text)
* `question_type text null`
* `needs_di_answer boolean not null default false`
* `created_at timestamptz not null default now()`

#### `di_answers`

* `id uuid primary key default gen_random_uuid()`
* `exam_id uuid not null references exams(id) on delete cascade`
* `question_id uuid not null references exam_questions(id) on delete cascade`
* `correct_option_key text not null`
* `created_at timestamptz not null default now()`
* unique `(exam_id, question_id)`

#### `exam_versions`

* `id uuid primary key default gen_random_uuid()`
* `exam_id uuid not null references exams(id) on delete cascade`
* `condition text not null`
* `status text not null default 'PENDING'`
* `google_doc_id text null`
* `google_doc_url text null`
* `limitations jsonb null`
* `qa_status text null`
* `qa_score numeric null`
* `qa_issues jsonb null`
* `created_at timestamptz not null default now()`
* `updated_at timestamptz not null default now()`
* unique `(exam_id, condition)`

#### `version_ratings`

* `id uuid primary key default gen_random_uuid()`
* `version_id uuid not null references exam_versions(id) on delete cascade`
* `user_id uuid not null references auth.users(id) on delete cascade`
* `rating int not null check (rating between 1 and 5)`
* `comment text null`
* `created_at timestamptz not null default now()`
* unique `(version_id, user_id)`

### 6.2 RLS (regras mínimas)

Habilitar RLS em todas as tabelas e garantir:

* Usuário só vê dados do próprio `user_id`
* Inserts sempre atrelados ao `auth.uid()`

Exemplos:

* `exams`: select/update/delete onde `user_id = auth.uid()`
* `exam_versions`: via join (ou armazenar `user_id` redundante)
* `exam_questions`, `di_answers`, `version_ratings`: idem

### 6.3 Storage (Supabase)

* Bucket privado: `exams`
* Path padrão: `${user_id}/${exam_id}/original.pdf`
* Para download do PDF original, gerar signed URL server-side.

---

## 7) Backend (Next.js) — API Routes / Server Actions

### 7.1 Endpoints necessários (App Router)

* `POST /api/exams`
  cria exam + faz upload (ou retorna URL para upload) + inicia n8n analyze
* `POST /api/exams/{id}/di-answers`
  salva respostas DI e dispara n8n generate
* `POST /api/n8n/callback`
  recebe callbacks de analyze/generate (verificar secret)
* `POST /api/versions/{versionId}/rating`
  salva rating 1–5
* `GET /api/exams?filters...`
  lista (para dashboard)
* `GET /api/exams/{id}`
  detalhe

### 7.2 Server-side supabase client

* Client “user session” (cookies) para operações do usuário
* Client “service role” somente no server para:

  * processar callback do n8n
  * assinar URLs de Storage

---

## 8) Estados (máquina de status)

### `exams.status` (recomendado)

* `UPLOADED`
* `ANALYZING`
* `WAITING_DI_INPUT`
* `GENERATING`
* `READY`
* `PARTIAL_READY`
* `FAILED`

### `exam_versions.status`

* `PENDING`
* `READY`
* `PARTIAL`
* `FAILED`

---

## 9) Critérios de aceite (Gherkin) — principais

### AC-LOGIN-01

Dado que estou na landpage
Quando clico “Entrar com Google”
Então devo autenticar via Supabase e acessar o dashboard.

### AC-NEW-EXAM-01

Dado que estou logado
Quando preencho disciplina e ano/série, seleciono adaptações e envio PDF
Então um exam é criado e seu status vira ANALYZING
E o n8n analyze é disparado.

### AC-DI-01 (fluxo DI)

Dado que selecionei DI e a prova tem questões objetivas
Quando o analyze retorna objective_questions
Então o exam entra em WAITING_DI_INPUT
E eu consigo informar alternativa correta por questão.

### AC-GENERATE-01

Dado que eu preenchi alternativas corretas (DI)
Quando clico “Gerar versões”
Então o n8n generate é disparado e o exam fica GENERATING.

### AC-RESULT-01

Dado que o n8n terminou
Quando o callback generate chegar
Então o exam vira READY ou PARTIAL_READY
E eu vejo cards por versão com link do Google Docs e download PDF.

### AC-HISTORY-01

Dado que tenho provas geradas
Quando acesso o dashboard
Então vejo histórico e consigo filtrar por disciplina/ano/habilidade.

---

## 10) Env vars (obrigatórias)

* `NEXT_PUBLIC_SUPABASE_URL`

* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

* `SUPABASE_SERVICE_ROLE_KEY`

* `NEXT_PUBLIC_APP_URL` (ex.: [https://app.seudominio.com](https://app.seudominio.com))

* `N8N_ANALYZE_WEBHOOK_URL`

* `N8N_GENERATE_WEBHOOK_URL`

* `APP_TO_N8N_SECRET`

* `N8N_TO_APP_SECRET`

---

## 11) Observabilidade / métricas (mínimo)

Eventos:

* login_success
* exam_created
* pdf_uploaded
* n8n_analyze_started / analyze_done / analyze_failed
* di_answers_submitted
* n8n_generate_started / generate_done / generate_failed
* version_open_doc
* version_download_pdf
* rating_submitted

---

## 12) Requisitos não funcionais

* UX clara de estados (loading, error, retry)
* Callback n8n com validação de secret
* Idempotência em callbacks
* Sem travar UI em request longo (assíncrono)

---

## 13) Checklist de entrega (para o Cursor)

* [ ] Next.js app com App Router + TS + UI básica (Tailwind recomendado)
* [ ] Supabase Auth Google configurado (README)
* [ ] SQL migrations das tabelas e RLS
* [ ] Storage upload PDF + signed URL
* [ ] Integração n8n (analyze/generate + callback)
* [ ] Dashboard + filtros
* [ ] Exam detail + versões + download/export PDF
* [ ] Ratings 1–5
* [ ] README de setup + .env.example

---

```

---

Se você quiser, eu também posso te entregar uma versão **“mais curta e ainda mais copiable”** (tipo 1–2 páginas) só com: **tabelas SQL + endpoints + contratos n8n + páginas**, pra ficar ainda melhor de colar no Cursor.
::contentReference[oaicite:1]{index=1}
```
