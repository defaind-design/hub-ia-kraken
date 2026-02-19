# Hub-IA-Kraken

Sistema modular de operação cognitiva baseado em agentes, utilizando o padrão Blackboard e Firebase como infraestrutura principal.

## Arquitetura

```
Frontend (Next.js) → Cloud Functions → Vertex AI (Gemini) → Firestore (Blackboard)
```

## Tecnologias

- **Backend**: Firebase Cloud Functions (2nd Gen), TypeScript
- **Database**: Firestore (multi-regional deployment em nam5)
- **AI**: Gemini 1.5 Flash via Vertex AI SDK
- **Frontend**: Next.js + Tailwind CSS (mobile-first)
- **Pattern**: Blackboard Architecture

## Estrutura do Projeto

```
hub-ia-kraken/
├── functions/              # Cloud Functions (2nd Gen)
│   ├── src/
│   │   ├── index.ts        # Função onTick com streaming
│   │   ├── config/         # Configuração Vertex AI
│   │   └── types/          # Tipos TypeScript
│   └── package.json
├── frontend/               # Next.js App
│   ├── app/                # App Router
│   ├── components/         # Componentes React
│   └── lib/                # Utilitários Firebase
├── firestore.rules         # Regras de segurança multi-tenant
└── firebase.json           # Configuração Firebase
```

## Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` e configure as variáveis:

```bash
cp .env.example .env
```

Configure:
- `GCP_PROJECT_ID`: ID do projeto GCP
- `VERTEX_AI_REGION`: Região do Vertex AI (ex: us-central1)
- `GOOGLE_APPLICATION_CREDENTIALS`: Caminho para service account key (opcional, pode usar ADC)

### 2. Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto (se necessário)
firebase init
```

### 3. Cloud Functions

```bash
cd functions
npm install
npm run build
```

### 4. Frontend

```bash
cd frontend
npm install
```

Configure variáveis de ambiente no frontend (`.env.local`):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_CLOUD_FUNCTION_URL=https://...
```

## Deploy

### Cloud Functions

```bash
cd functions
npm run deploy
```

### Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Frontend

```bash
cd frontend
npm run build
# Deploy via Firebase Hosting ou Vercel
```

## Funcionalidades Principais

### Função `onTick`

- **Tipo**: HTTP callable function (2nd Gen)
- **Streaming**: Usa Vertex AI SDK com `generateContentStream`
- **Atualização Firestore**: Cada chunk do Gemini atualiza `sessions/{sessionId}.lastDelta` com `serverTimestamp()`
- **Blackboard**: Todos os agentes compartilham o mesmo documento `sessions/{sessionId}` como contexto

### Multi-tenancy

- Usuários só podem acessar dados de sua `organizationId`
- Regras de segurança implementadas em `firestore.rules`

### Otimizações Spark Plan

- Timeout de 60s para HTTP functions
- Processamento assíncrono eficiente
- Streaming ao invés de buffer completo
- Evita loops infinitos e operações custosas

## Uso

1. Criar uma sessão no Firestore (ou usar a interface do frontend)
2. Enviar prompt via função `onTick`
3. Visualizar streaming em tempo real no frontend
4. Contexto compartilhado via Blackboard pattern

## Desenvolvimento

```bash
# Emulators
cd functions
npm run serve

# Frontend dev
cd frontend
npm run dev
```

## Licença

MIT
