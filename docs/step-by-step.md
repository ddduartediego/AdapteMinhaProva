# Step-by-Step - Desenvolvimento do Adapte Minha Prova

Este documento registra todas as etapas e arquivos criados durante o desenvolvimento do projeto.

---

## Fase 1: Estrutura Base

### 1.1 Configuração do Projeto

**Arquivos criados:**

| Arquivo | Função |
|---------|--------|
| `package.json` | Dependências e scripts do projeto |
| `tsconfig.json` | Configuração TypeScript |
| `tailwind.config.ts` | Configuração Tailwind CSS com tema customizado |
| `postcss.config.mjs` | Configuração PostCSS |
| `next.config.ts` | Configuração Next.js (Server Actions, imagens) |
| `.gitignore` | Arquivos ignorados pelo Git |
| `env.example.txt` | Template de variáveis de ambiente |
| `middleware.ts` | Middleware de autenticação Supabase |

### 1.2 Utilitários Base

| Arquivo | Função |
|---------|--------|
| `src/lib/utils.ts` | Utilitários (cn, formatDate, truncate) |
| `src/lib/supabase/client.ts` | Cliente Supabase para browser |
| `src/lib/supabase/server.ts` | Cliente Supabase para server (user + service role) |
| `src/lib/supabase/middleware.ts` | Lógica do middleware de sessão |
| `src/lib/n8n.ts` | Funções de integração com n8n |

---

## Fase 2: Banco de Dados

### 2.1 Migrations SQL

**Arquivo:** `supabase/migrations/001_initial_schema.sql`

**Tabelas criadas:**

1. **exams** - Provas principais
   - Metadados (disciplina, ano, habilidades)
   - Resultados de análise (BNCC, Bloom)
   - Status e tracking

2. **exam_questions** - Questões extraídas
   - Ordem, enunciado, alternativas
   - Flag para DI

3. **di_answers** - Respostas corretas para DI
   - Questão e alternativa correta
   - Constraint UNIQUE por exam+question

4. **exam_versions** - Versões adaptadas
   - Condição, status, links Google Docs
   - Limitações e QA

5. **version_ratings** - Avaliações
   - Nota 1-5 e comentário

**RLS configurado** para todas as tabelas garantindo acesso apenas aos próprios dados.

---

## Fase 3: Types e Contratos

### 3.1 TypeScript Types

| Arquivo | Conteúdo |
|---------|----------|
| `src/types/database.ts` | Tipos do banco, enums, interfaces de tabelas |
| `src/types/n8n.ts` | Contratos de comunicação com n8n |

**Tipos principais:**
- `ExamStatus` - Estados da prova
- `VersionStatus` - Estados da versão
- `Condition` - Tipos de adaptação
- `BloomLevel` - Níveis de Bloom
- Payloads e callbacks n8n

---

## Fase 4: Componentes UI

### 4.1 Componentes Base (shadcn/ui style)

| Componente | Arquivo | Função |
|------------|---------|--------|
| Button | `src/components/ui/button.tsx` | Botões com variantes |
| Card | `src/components/ui/card.tsx` | Cards de conteúdo |
| Input | `src/components/ui/input.tsx` | Campos de texto |
| Label | `src/components/ui/label.tsx` | Labels acessíveis |
| Checkbox | `src/components/ui/checkbox.tsx` | Checkboxes |
| Select | `src/components/ui/select.tsx` | Selects dropdown |
| RadioGroup | `src/components/ui/radio-group.tsx` | Radio buttons |
| Badge | `src/components/ui/badge.tsx` | Badges de status |
| Progress | `src/components/ui/progress.tsx` | Barras de progresso |
| Separator | `src/components/ui/separator.tsx` | Separadores |
| Textarea | `src/components/ui/textarea.tsx` | Áreas de texto |
| Toast | `src/components/ui/toast.tsx` | Notificações |
| Toaster | `src/components/ui/toaster.tsx` | Provider de toasts |
| Dialog | `src/components/ui/dialog.tsx` | Modais |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Menus dropdown |
| Spinner | `src/components/ui/spinner.tsx` | Loading spinner |

### 4.2 Componentes Específicos

| Componente | Arquivo | Função |
|------------|---------|--------|
| FileUpload | `src/components/file-upload.tsx` | Upload de PDF com drag-and-drop |
| ConditionCard | `src/components/condition-card.tsx` | Card de seleção de condição |
| StatusBadge | `src/components/status-badge.tsx` | Badges de status formatados |
| LoginButton | `src/components/auth/login-button.tsx` | Botão de login Google |
| AppHeader | `src/components/layout/app-header.tsx` | Header da área protegida |

### 4.3 Componentes de Exames

| Componente | Arquivo | Função |
|------------|---------|--------|
| ExamsList | `src/components/exams/exams-list.tsx` | Lista de provas no dashboard |
| ExamsFilters | `src/components/exams/exams-filters.tsx` | Filtros do dashboard |
| ExamStatusStepper | `src/components/exams/exam-status-stepper.tsx` | Stepper visual de status |
| DiAnswersForm | `src/components/exams/di-answers-form.tsx` | Formulário de respostas DI |
| VersionCard | `src/components/exams/version-card.tsx` | Card de versão adaptada |
| RatingDialog | `src/components/exams/rating-dialog.tsx` | Dialog de avaliação |

### 4.4 Hooks

| Hook | Arquivo | Função |
|------|---------|--------|
| useToast | `src/hooks/use-toast.ts` | Hook para notificações toast |

---

## Fase 5: Páginas

### 5.1 Layout Global

| Arquivo | Função |
|---------|--------|
| `src/app/layout.tsx` | Layout raiz com fonts e Toaster |
| `src/app/globals.css` | Estilos globais, tema CSS vars, gradientes |

### 5.2 Páginas Públicas

| Página | Arquivo | Função |
|--------|---------|--------|
| Landing | `src/app/(public)/page.tsx` | Home page com CTA |
| Layout | `src/app/(public)/layout.tsx` | Layout público |

**Features da Landing:**
- Hero section animada
- "Como funciona" em 3 passos
- Cards de condições suportadas
- CTA final

### 5.3 Páginas Protegidas

| Página | Arquivo | Função |
|--------|---------|--------|
| Layout | `src/app/(protected)/layout.tsx` | Verifica auth + header |
| Dashboard | `src/app/(protected)/app/page.tsx` | Lista de provas |
| Nova Prova | `src/app/(protected)/app/new/page.tsx` | Formulário de criação |
| Detalhe | `src/app/(protected)/app/exams/[id]/page.tsx` | Detalhes e versões |

### 5.4 Auth

| Arquivo | Função |
|---------|--------|
| `src/app/auth/callback/route.ts` | Callback do OAuth |

---

## Fase 6: API Routes

### 6.1 Endpoints

| Método | Rota | Arquivo | Função |
|--------|------|---------|--------|
| POST | /api/exams | `route.ts` | Criar prova + upload PDF |
| GET | /api/exams | `route.ts` | Listar provas |
| POST | /api/exams/[id]/di-answers | `route.ts` | Salvar respostas DI |
| POST | /api/n8n/callback | `route.ts` | Receber callbacks n8n |
| POST | /api/versions/[id]/rating | `route.ts` | Avaliar versão |

### 6.2 Fluxo de Criação

1. Usuário envia formulário com PDF
2. API cria registro no banco
3. Upload do PDF para Storage
4. Gera signed URL
5. Dispara n8n analyze
6. Atualiza status para ANALYZING

### 6.3 Fluxo de Callback

**Analyze:**
1. n8n envia resultados (BNCC, Bloom, questões)
2. API atualiza exam e insere questions
3. Se DI selecionado → WAITING_DI_INPUT
4. Senão → READY_TO_GENERATE

**Generate:**
1. n8n envia versões geradas
2. API upserta exam_versions
3. Atualiza exam para READY ou PARTIAL_READY

---

## Fase 7: Documentação

| Arquivo | Função |
|---------|--------|
| `README.md` | Documentação principal |
| `docs/step-by-step.md` | Este arquivo |

---

## Arquivos Criados (Total)

### Configuração (7 arquivos)
- package.json, tsconfig.json, tailwind.config.ts
- postcss.config.mjs, next.config.ts
- .gitignore, env.example.txt

### Core (6 arquivos)
- middleware.ts
- src/lib/utils.ts
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- src/lib/supabase/middleware.ts
- src/lib/n8n.ts

### Types (2 arquivos)
- src/types/database.ts
- src/types/n8n.ts

### Componentes UI (17 arquivos)
- Button, Card, Input, Label, Checkbox
- Select, RadioGroup, Badge, Progress
- Separator, Textarea, Toast, Toaster
- Dialog, DropdownMenu, Spinner

### Componentes App (11 arquivos)
- FileUpload, ConditionCard, StatusBadge
- LoginButton, AppHeader
- ExamsList, ExamsFilters, ExamStatusStepper
- DiAnswersForm, VersionCard, RatingDialog

### Hooks (1 arquivo)
- use-toast.ts

### Páginas (8 arquivos)
- Layout global + globals.css
- Landing (page + layout)
- Dashboard (layout + page)
- New exam page
- Exam detail page
- Auth callback

### API (5 arquivos)
- /api/exams (POST, GET)
- /api/exams/[id]/di-answers (POST)
- /api/n8n/callback (POST)
- /api/versions/[id]/rating (POST)

### Database (1 arquivo)
- 001_initial_schema.sql

### Documentação (2 arquivos)
- README.md
- docs/step-by-step.md

---

## Próximos Passos Sugeridos

1. **Configurar Supabase**
   - Criar projeto
   - Executar migrations
   - Configurar Auth (Google OAuth)
   - Criar bucket storage

2. **Configurar n8n**
   - Criar workflows de analyze e generate
   - Configurar webhooks com secrets
   - Integrar com OpenAI/Claude
   - Integrar com Google Docs API

3. **Deploy**
   - Deploy na Vercel
   - Configurar domínio
   - Configurar variáveis de produção

4. **Melhorias Futuras**
   - Polling/SSE para status em tempo real
   - Preview do PDF original
   - Histórico de versões
   - Exportação em lote
   - Dashboard de métricas

---

## Correções e Bugfixes

### Bugfix: Loop infinito no Checkbox - Substituição por Checkbox nativo (16/01/2026)

**Arquivos:** 
- `src/components/ui/checkbox.tsx`
- `src/components/condition-card.tsx`

**Problema:** Erro "Maximum update depth exceeded" ao interagir com os checkboxes no ConditionCard (Adaptações Desejadas).

**Causa:** Incompatibilidade entre React 19 e Radix UI Checkbox, similar ao problema com Select.

**Solução:** 
1. Reescrito o componente `Checkbox` usando `<input type="checkbox" />` nativo
2. Visual customizado com span estilizado e ícone Check do Lucide
3. Simplificado o `ConditionCard` removendo tratamento de `'indeterminate'`
4. API mantida: `checked`, `onCheckedChange`, `disabled`, `className`

---

### Bugfix: Loop infinito no Select - Substituição por Select nativo (16/01/2026)

**Arquivos:** 
- `src/app/(protected)/app/new/page.tsx`
- `src/components/exams/exams-filters.tsx`

**Problema:** Erro "Maximum update depth exceeded" ao interagir com os Selects. O problema persistia mesmo após tentativas de client-only rendering.

**Causa:** Incompatibilidade profunda entre React 19 e Radix UI Select. O componente causa loops de re-renderização que não são resolvidos apenas com técnicas de client-only.

**Solução:** 
1. Substituição dos componentes Radix UI Select por selects nativos HTML
2. Criação de componentes `NativeSelect` e `FilterSelect` com estilização consistente
3. Uso de CSS para estilizar o dropdown arrow (background-image SVG)
4. Mantida a mesma aparência visual e funcionalidade

**Benefícios:**
- Elimina completamente o problema de incompatibilidade
- Melhor acessibilidade (selects nativos são mais acessíveis)
- Menor bundle size (menos código JavaScript)
- Funcionamento garantido em todos os navegadores

---

### Bugfix: Hydration mismatch no AppHeader (16/01/2026)

**Arquivo:** `src/components/layout/app-header.tsx`

**Problema:** Erro de hydration mismatch devido ao DropdownMenu do Radix UI gerar IDs diferentes entre SSR e cliente.

**Causa:** O Radix UI usa `useId()` internamente para gerar IDs únicos. Quando o componente é renderizado no servidor (SSR) e depois hidratado no cliente, os IDs gerados podem diferir.

**Solução:** Implementado padrão "client-only" para o DropdownMenu:
1. Estado `isMounted` que inicia como `false`
2. `useEffect` que define `isMounted = true` após a primeira renderização
3. DropdownMenu só é renderizado quando `isMounted === true`
4. No SSR, mostra apenas o botão de avatar sem o dropdown

Isso garante que o DropdownMenu (com seus IDs dinâmicos) só seja renderizado no cliente, evitando o mismatch.

---

### Bugfix: Loop infinito no ConditionCard (16/01/2026)

**Arquivo:** `src/components/condition-card.tsx`

**Problema:** Ao clicar em uma opção de "Adaptações Desejadas", ocorria erro de "Maximum update depth exceeded" (loop infinito de atualizações).

**Causa:** O componente tinha dois handlers que podiam disparar ao mesmo tempo:
1. `onClick` na div externa: chamava `onCheckedChange(!checked)`
2. `onCheckedChange` no Checkbox: também chamava `onCheckedChange`

Quando o clique era no checkbox ou label, ambos eram acionados, causando atualizações duplas.

**Solução:**
1. Handler `handleClick` na div agora verifica se o clique foi no checkbox/label e ignora nesses casos
2. Handler `handleCheckedChange` trata o tipo `CheckedState` do Radix corretamente (pode ser `boolean | 'indeterminate'`)

---

### UX: Melhoria no estado vazio do dashboard (16/01/2026)

**Arquivos:** 
- `src/app/(protected)/app/page.tsx`
- `src/components/exams/exams-list.tsx`

**Problema:** No primeiro login, quando não há provas, era exibida mensagem de erro genérica "Erro ao carregar provas. Tente novamente.", criando uma experiência negativa para novos usuários.

**Solução:**
1. Removido tratamento de erro que exibia mensagem assustadora
2. Erros de query agora resultam em lista vazia (graceful degradation)
3. Estado vazio redesenhado para ser acolhedor:
   - Mensagem de boas-vindas personalizada
   - Visual mais convidativo com cores e gradientes
   - CTA claro para criar primeira adaptação
   - Ícone maior e mais destacado

---

### Bugfix: SelectItem com valor vazio (16/01/2026)

**Arquivo:** `src/components/exams/exams-filters.tsx`

**Problema:** O componente `SelectItem` do Radix UI não permite `value=""` (string vazia), pois esse valor é reservado para limpar a seleção e mostrar o placeholder.

**Erro:**
```
A <Select.Item /> must have a value prop that is not an empty string.
```

**Solução:** Substituir `value=""` por `value="all"` nos SelectItems de "Todas" e "Todos", e tratar esse valor especialmente no `onValueChange`:

```tsx
// Antes
<SelectItem value="">Todas</SelectItem>
onValueChange={(value) => updateFilter('disciplina', value || undefined)}

// Depois  
<SelectItem value="all">Todas</SelectItem>
onValueChange={(value) => updateFilter('disciplina', value === 'all' ? undefined : value)}
```

---

## Fase 8: Workflow N8N

### 8.1 Criação do Workflow N8N (16/01/2026)

**Arquivos criados:**

| Arquivo | Função |
|---------|--------|
| `n8n/adapte-minha-prova-workflow.json` | Workflow completo para importar no N8N |
| `n8n/README.md` | Documentação de configuração e uso do workflow |

**Descrição:**
Criado workflow N8N completo que implementa os dois fluxos principais do sistema:

### Fluxo ANALYZE
1. **Webhook Analyze** - Recebe requisição da aplicação
2. **ACK Analyze** - Retorna resposta imediata (202)
3. **Download PDF** - Baixa o PDF via signed URL (como binary/base64)
4. **Set Context** - Prepara dados incluindo PDF em base64
5. **OpenAI Analyze (with PDF)** - Envia PDF como anexo para GPT-4o Vision
6. **Prepare Callback** - Monta payload de resposta
7. **Send Callback** - Envia resultado para a aplicação

### Fluxo GENERATE
1. **Webhook Generate** - Recebe requisição da aplicação
2. **ACK Generate** - Retorna resposta imediata (202)
3. **Download PDF** - Baixa o PDF via signed URL (como binary/base64)
4. **Set Context** - Prepara dados incluindo PDF em base64
5. **Split by Condition** - Divide em itens por condição (DI, TEA, etc.)
6. **OpenAI Generate (with PDF)** - Envia PDF como anexo para GPT-4o Vision
7. **Extract Content** - Extrai o conteúdo gerado
8. **Create Google Doc** - Cria documento no Google Docs
9. **Update Content** - Insere conteúdo adaptado
10. **Share Doc** - Compartilha com o email do professor
11. **Aggregate Versions** - Consolida resultados
12. **Send Callback** - Envia resultado para a aplicação

**Vantagem do envio direto do PDF:**
O GPT-4o Vision analisa o documento visualmente, preservando contexto de layout, imagens, tabelas e gráficos que seriam perdidos na extração de texto simples.

**Credenciais necessárias:**
- OpenAI Bearer Auth (Header: `Authorization: Bearer sk-...`)
- Google Docs OAuth2
- Google Drive OAuth2
- Header Auth (X-N8N-SECRET)

**Configuração:**
1. Importar JSON no N8N
2. Configurar credenciais
3. Ativar workflows
4. Copiar URLs dos webhooks para o `.env` da aplicação

---

### Bugfix: Configuração do Webhook N8N (16/01/2026)

**Arquivo:** `n8n/adapte-minha-prova-workflow.json`

**Problema 1:** Erro `WorkflowConfigurationError: Unused Respond to Webhook node found in the workflow`

**Causa:** Os webhooks estavam configurados com "Respond: Immediately", mas o workflow também tinha nós "Respond to Webhook" (ACK Analyze/Generate) conectados. O n8n não permite ambos ao mesmo tempo.

**Solução:** Adicionado `"responseMode": "responseNode"` nos parâmetros dos webhooks para indicar que a resposta será enviada pelo nó "Respond to Webhook".

---

**Problema 2:** Erro `NodeOperationError: URL parameter must be a string, got undefined`

**Causa:** Todas as expressões usavam `$json.body.` para acessar os dados do webhook, mas nas versões mais recentes do n8n (1.119+), os dados do body POST vêm diretamente em `$json`, não em `$json.body`.

**Solução:** Corrigidas todas as referências:
- `$('Webhook Analyze').item.json.body.pdf.signed_url` → `$('Webhook Analyze').item.json.pdf.signed_url`
- `$json.body.exam_id` → `$json.exam_id`
- E todas as outras referências similares

**Correções aplicadas em:**
- URLs de download do PDF (analyze e generate)
- Nós "Set Analyze Context" e "Set Generate Context"
- Nós "ACK Analyze" e "ACK Generate"

---

### Bugfix: Formato de envio de PDF para OpenAI API (16/01/2026)

**Arquivo:** `n8n/adapte-minha-prova-workflow.json`

**Problema:** Erro `Missing required parameter: 'messages[1].content[1].file.file_id'` ao enviar PDF para a API da OpenAI.

**Causa:** O formato de envio de arquivos PDF estava incorreto. Estávamos usando:
```json
{
  "type": "file",
  "file": {
    "url": "data:application/pdf;base64,..."
  }
}
```

**Solução:** Atualizado para o formato correto da API da OpenAI:
```json
{
  "type": "input_file",
  "input_file": {
    "file_data": "data:application/pdf;base64,..."
  }
}
```

**Arquivos criados:**
- `n8n/openai-nodes-only.json` - JSON com apenas os nós OpenAI atualizados para importação rápida no n8n

**Modelos que suportam PDF:** GPT-4o, GPT-4o-mini, o1 (modelos com capacidade visual)

---

### Bugfix: Status READY_TO_GENERATE não mapeado (17/01/2026)

**Arquivos:**
- `src/types/database.ts`
- `src/components/status-badge.tsx`

**Problema:** Erro `TypeError: Cannot read properties of undefined (reading 'variant')` ao exibir badge de status após callback de análise bem-sucedido.

**Causa:** O status `READY_TO_GENERATE` era definido no callback da API após análise, mas não estava mapeado no tipo `ExamStatus` nem no componente `ExamStatusBadge`.

**Solução:**
1. Adicionado `READY_TO_GENERATE` ao tipo `ExamStatus` em `database.ts`
2. Adicionado mapeamento para `READY_TO_GENERATE` em `examStatusConfig` do `status-badge.tsx`:
   ```typescript
   READY_TO_GENERATE: { label: 'Pronto p/ Gerar', variant: 'ready' }
   ```

---

### UX: Disparo automático de geração quando DI não é selecionado (17/01/2026)

**Arquivos modificados:**
- `src/app/api/n8n/callback/route.ts`
- `src/components/exams/exam-status-stepper.tsx`
- `src/components/status-badge.tsx`
- `src/app/(protected)/app/exams/[id]/page.tsx`

**Problema:** Quando o usuário NÃO selecionava a condição DI (Deficiência Intelectual), após a análise o status mudava para `READY_TO_GENERATE`, mas não havia nenhum botão ou ação para disparar a geração. O usuário ficava "preso" nessa tela sem saber o que fazer.

**Causa:** O fluxo original previa duas situações após a análise:
1. Com DI + questões objetivas → `WAITING_DI_INPUT` → usuário preenche respostas → botão "Continuar"
2. Sem DI → `READY_TO_GENERATE` → **nenhuma ação implementada**

**Solução implementada:**

1. **Disparo automático no callback** (`/api/n8n/callback`):
   - Quando não é necessário input de DI, o status vai direto para `GENERATING`
   - O `triggerGenerate()` é chamado automaticamente no mesmo callback
   - Gera signed URL e dispara o webhook do N8N imediatamente

2. **Stepper adaptativo** (`exam-status-stepper.tsx`):
   - Nova prop `hasDI?: boolean` para condicionar os passos exibidos
   - Com DI: 5 passos (Enviado → Analisando → Aguardando DI → Gerando → Pronto)
   - Sem DI: 4 passos (Enviado → Analisando → Gerando → Pronto)
   - `READY_TO_GENERATE` é mapeado para "Gerando" visualmente

3. **Badge unificado** (`status-badge.tsx`):
   - `READY_TO_GENERATE` agora exibe "Gerando" (era "Pronto p/ Gerar")
   - Usa a mesma variante `generating` para consistência visual

4. **Página de detalhes** (`exams/[id]/page.tsx`):
   - Passa `hasDI` para o stepper
   - `READY_TO_GENERATE` é tratado como estado de loading (igual a GENERATING)

**Fluxo atualizado:**

| Cenário | Após Análise | Status | Ação | UX |
|---------|--------------|--------|------|-----|
| Com DI + questões objetivas | Aguarda input | `WAITING_DI_INPUT` | Usuário preenche | Formulário exibido |
| Sem DI ou sem questões | Gera automaticamente | `GENERATING` | Disparo automático | Loading exibido |

**Benefícios:**
- UX fluida: usuário não precisa clicar em nada, a geração começa automaticamente
- Stepper limpo: sem passos desnecessários quando DI não está selecionado
- Consistência: status sempre mostra estado real da operação

---

## Fase 9: Melhorias de UX

### 9.1 Atualização em Tempo Real com Supabase Realtime (20/01/2026)

**Problema:** Após enviar a prova para processamento, o usuário precisava atualizar a página manualmente para ver o progresso e os resultados. Isso criava uma experiência frustrante, especialmente durante os estados de `ANALYZING` e `GENERATING`.

**Solução:** Implementação de Supabase Realtime para escutar mudanças no banco de dados e atualizar a UI automaticamente.

**Arquivos criados/modificados:**

| Arquivo | Tipo | Função |
|---------|------|--------|
| `src/hooks/use-exam-realtime.ts` | Novo | Hook para gerenciar subscriptions do Supabase Realtime |
| `src/components/exams/exam-detail-client.tsx` | Novo | Client Component com estado reativo e subscriptions |
| `src/app/(protected)/app/exams/[id]/page.tsx` | Modificado | Refatorado para usar padrão híbrido Server + Client |
| `supabase/migrations/002_enable_realtime.sql` | Novo | Migration para habilitar Realtime nas tabelas |

**Arquitetura implementada:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Fluxo de Dados                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Usuário acessa /app/exams/{id}                          │
│                    ↓                                        │
│  2. Server Component busca dados iniciais (SSR)             │
│                    ↓                                        │
│  3. Client Component recebe dados e inicia subscription     │
│                    ↓                                        │
│  4. n8n processa e envia callback → banco atualiza          │
│                    ↓                                        │
│  5. Supabase Realtime notifica Client via WebSocket         │
│                    ↓                                        │
│  6. Client dispara router.refresh() para re-fetch           │
│                    ↓                                        │
│  7. UI atualiza automaticamente                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Hook `useExamRealtime`:**
- Escuta UPDATE na tabela `exams` filtrado por `id=eq.{examId}`
- Escuta INSERT/UPDATE/DELETE na tabela `exam_versions` filtrado por `exam_id`
- Escuta mudanças na tabela `exam_questions` para atualizar formulário DI
- Cleanup automático via useEffect return

**Client Component `ExamDetailClient`:**
- Recebe dados iniciais via props do Server Component
- Mantém estado local para permitir re-renderização
- Usa `useTransition` para indicar loading durante refresh
- Exibe indicador visual "Atualizando em tempo real" durante processamento
- Mostra toast quando status muda para estados finais

**Indicadores visuais adicionados:**
- Dot pulsante verde durante estados de processamento
- Spinner quando está fazendo refresh
- Timestamp da última atualização
- Mensagem "Esta página atualiza automaticamente" no card de loading

**Migration SQL `002_enable_realtime.sql`:**
1. `REPLICA IDENTITY FULL` nas tabelas para receber dados completos no payload
2. Adiciona tabelas à publicação `supabase_realtime`
3. Idempotente (verifica antes de adicionar)

**Para aplicar a migration:**
```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no Supabase Dashboard > SQL Editor
```

**Benefícios:**
- UX significativamente melhorada: usuário não precisa atualizar página
- Feedback em tempo real do progresso
- Uso eficiente de recursos (WebSocket vs polling)
- Compatível com RLS (usuário só recebe updates dos próprios exams)

---

*Documento gerado automaticamente durante o desenvolvimento.*
