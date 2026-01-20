# N8N Workflow - Adapte Minha Prova

Este diretório contém o workflow N8N para o sistema "Adapte Minha Prova".

## 📋 Visão Geral

O workflow implementa dois fluxos principais:

### 1. Fluxo ANALYZE (Análise da Prova)
- Recebe o PDF da prova via webhook
- **Envia o PDF diretamente para GPT-4o Vision** (preserva layout, imagens e formatação)
- Usa GPT-4o para identificar:
  - Habilidade BNCC (Base Nacional Comum Curricular)
  - Nível cognitivo de Bloom
  - Questões objetivas (múltipla escolha)
- Gera relatórios de BNCC/Bloom e ementa
- Envia callback para a aplicação

### 2. Fluxo GENERATE (Geração de Versões)
- Recebe dados da prova analisada
- **Envia o PDF original para GPT-4o Vision** junto com contexto
- Para cada condição selecionada (DI, TEA, Dislexia, etc.):
  - Gera versão adaptada usando GPT-4o com acesso visual ao PDF
  - Cria Google Doc com o conteúdo
  - Compartilha com o email do professor
- Envia callback com links dos documentos

> **Vantagem do envio direto do PDF:** O GPT-4o Vision analisa o documento visualmente, preservando contexto de layout, imagens, tabelas e gráficos que seriam perdidos na extração de texto simples.

## 🚀 Como Importar

### Workflow Completo
1. Acesse seu N8N
2. Vá em **Workflows** → **Import from File**
3. Selecione o arquivo `adapte-minha-prova-workflow.json`
4. Configure as credenciais (veja abaixo)

### Apenas os Nós OpenAI (Atualização Rápida)
Se você já tem o workflow e só precisa atualizar os nós de OpenAI:
1. No seu workflow existente, delete os nós "OpenAI Analyze Exam (with PDF)" e "OpenAI Generate Version (with PDF)"
2. Clique com botão direito no canvas → **Import from File**
3. Selecione `openai-nodes-only.json`
4. Reconecte os nós às conexões anteriores
5. Configure as credenciais

## 🔐 Credenciais Necessárias

### 1. OpenAI Bearer Auth (para envio de PDF)
- **Tipo:** Header Auth
- **Header Name:** `Authorization`
- **Header Value:** `Bearer sk-your-openai-api-key`
- **Nome sugerido:** `OpenAI Bearer Auth`

> **Nota:** Usamos HTTP Request com Header Auth em vez do node OpenAI nativo para poder enviar o PDF como arquivo anexo (file type) na mensagem.

### 2. Google Docs OAuth2
- **Tipo:** Google Docs OAuth2 API
- **Configurar no Google Cloud Console:**
  - Criar projeto
  - Habilitar APIs: Google Docs API, Google Drive API
  - Criar credenciais OAuth2
  - Adicionar escopos: `docs`, `drive`
- **Nome sugerido:** `Google Docs OAuth2`

### 3. Google Drive OAuth2
- **Tipo:** Google Drive OAuth2 API
- **Mesmas credenciais do Google Docs**
- **Nome sugerido:** `Google Drive OAuth2`

### 4. Header Auth para Callbacks
- **Tipo:** Header Auth
- **Header Name:** `X-N8N-SECRET`
- **Header Value:** Valor da variável `N8N_TO_APP_SECRET` do seu `.env`
- **Nome sugerido:** `N8N to App Secret`

## ⚙️ Configuração das Variáveis de Ambiente

No seu arquivo `.env` da aplicação Next.js:

```env
# URLs dos webhooks (copiar do N8N após ativar o workflow)
N8N_ANALYZE_WEBHOOK_URL=https://seu-n8n.com/webhook/analyze-exam
N8N_GENERATE_WEBHOOK_URL=https://seu-n8n.com/webhook/generate-versions

# Secrets para autenticação
APP_TO_N8N_SECRET=seu-secret-seguro-app-para-n8n
N8N_TO_APP_SECRET=seu-secret-seguro-n8n-para-app
```

## 🔄 Fluxo de Dados

### ANALYZE (App → N8N → App)

```
App envia:
{
  "event": "analyze_exam",
  "exam_id": "uuid",
  "user": { "id": "uuid", "email": "professor@email.com" },
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
    "url": "https://app.com/api/n8n/callback",
    "secret_header_name": "X-N8N-SECRET"
  }
}

N8N retorna ACK imediato:
{
  "accepted": true,
  "exam_id": "uuid",
  "n8n_run_id": "execution_id"
}

N8N envia callback:
{
  "event": "analyze_exam_result",
  "exam_id": "uuid",
  "status": "OK",
  "bncc": {
    "code": "EF05MA07",
    "description": "Resolver e elaborar problemas...",
    "confidence": 0.85
  },
  "bloom": {
    "level": "COMPREENDER",
    "confidence": 0.78
  },
  "reports": {
    "bncc_bloom_report_md": "### BNCC...",
    "ementa_report_md": "### Ementa..."
  },
  "extracted": {
    "objective_questions": [...]
  }
}
```

### GENERATE (App → N8N → App)

```
App envia:
{
  "event": "generate_exam_versions",
  "exam_id": "uuid",
  "user": { "email": "professor@email.com" },
  "selected_conditions": ["DI", "DISLEXIA"],
  "metadata": {...},
  "bncc": { "code": "EF05MA07", "description": "..." },
  "bloom": { "level": "COMPREENDER" },
  "di_answers": [
    { "question_id": "q1", "correct_option_key": "B" }
  ],
  "pdf": { "signed_url": "https://..." },
  "callback": { "url": "https://app.com/api/n8n/callback" }
}

N8N envia callback:
{
  "event": "generate_exam_versions_result",
  "exam_id": "uuid",
  "status": "OK",
  "versions": [
    {
      "condition": "DI",
      "status": "READY",
      "google_doc_id": "doc123",
      "google_doc_url": "https://docs.google.com/document/d/doc123/edit"
    },
    {
      "condition": "DISLEXIA",
      "status": "READY",
      "google_doc_id": "doc456",
      "google_doc_url": "https://docs.google.com/document/d/doc456/edit"
    }
  ],
  "qa": {
    "status": "OK",
    "score": 95
  }
}
```

## 🎯 Condições de Adaptação Suportadas

| Condição | Descrição | Adaptações Principais |
|----------|-----------|----------------------|
| **DI** | Deficiência Intelectual | Linguagem simplificada, destaque da resposta correta |
| **TEA** | Transtorno do Espectro Autista | Instruções literais, estrutura visual |
| **DISLEXIA** | Dislexia | Fonte especial, espaçamento, destaques |
| **DISGRAFIA** | Disgrafia | Mais espaço, opção de resposta oral |
| **DISCALCULIA** | Discalculia | Apoios visuais, tabelas de referência |
| **TDAH** | Déficit de Atenção/Hiperatividade | Questões separadas, caixas de destaque |

## 📝 Guardrails (Regras de Segurança)

O workflow respeita as seguintes regras:

1. ❌ **NUNCA** revelar respostas no enunciado (exceto DI quando fornecida)
2. ❌ **NUNCA** alterar a habilidade BNCC identificada
3. ❌ **NUNCA** reduzir o nível cognitivo de Bloom
4. ❌ **NUNCA** remover elementos essenciais do problema

## 🐛 Troubleshooting

### Erro de autenticação no webhook
- Verifique se o header `X-APP-SECRET` está sendo enviado corretamente
- Configure a autenticação "Header Auth" no N8N

### PDF não é extraído corretamente
- Verifique se a URL assinada está válida
- O PDF deve ter texto selecionável (não escaneado)

### Google Docs não é criado
- Verifique as permissões OAuth do Google
- Certifique-se de que as APIs estão habilitadas

### Callback não é recebido
- Verifique se a URL de callback está acessível publicamente
- Verifique se o header `X-N8N-SECRET` está configurado corretamente

## 📊 Diagrama do Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO ANALYZE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Webhook Analyze] ──┬──► [ACK Analyze]                             │
│                      │                                               │
│                      └──► [Download PDF] ──► [Set Context]           │
│                                                    │                 │
│                                                    ▼                 │
│                              [OpenAI Analyze with PDF Vision]        │
│                                                    │                 │
│                                          ┌────────┴────────┐         │
│                                          ▼                 ▼         │
│                                    [If Error]        [Prepare OK]    │
│                                          │                 │         │
│                                          ▼                 ▼         │
│                              [Send Error Callback] [Send Callback]   │
│                                                                      │
│  📄 O PDF é enviado em base64 diretamente para GPT-4o Vision        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO GENERATE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Webhook Generate] ──┬──► [ACK Generate]                            │
│                       │                                              │
│                       └──► [Download PDF] ──► [Set Context]          │
│                                                     │                │
│                                                     ▼                │
│                                        [Split by Condition]          │
│                                                     │                │
│                                    ┌────────────────┼────────────┐   │
│                                    ▼                ▼            ▼   │
│                           [OpenAI + PDF]    [OpenAI + PDF]  [OpenAI] │
│                                    │                │            │   │
│                                    ▼                ▼            ▼   │
│                         [Extract Content] ──► [Create Doc]           │
│                                                     │                │
│                                                     ▼                │
│                                         [Update Doc Content]         │
│                                                     │                │
│                                                     ▼                │
│                                              [Share Doc]             │
│                                                     │                │
│                                                     ▼                │
│                                         [Aggregate Versions]         │
│                                                     │                │
│                                                     ▼                │
│                                           [Send Callback]            │
│                                                                      │
│  📄 O PDF é enviado junto com cada requisição de adaptação          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 📄 Licença

Este workflow é parte do projeto Adapte Minha Prova e está sob a mesma licença do projeto principal.
