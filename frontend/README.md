# 🖥️ Frontend - Financial Planning Dashboard

## 📋 **Visão Geral**

Interface moderna desenvolvida com **Next.js 14** (App Router) para o sistema de planejamento financeiro Multi Family Office. Oferece dashboard executivo, gestão completa de clientes e portfólios, projeções interativas até 2060 e importação CSV em tempo real.

### **🔧 Stack Técnica**
- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: ShadCN/UI + Tailwind CSS (dark-mode default)
- **State Management**: TanStack Query (React Query v5)
- **Forms**: React-Hook-Form + Zod validation
- **HTTP Client**: Axios com interceptadores
- **Charts**: Recharts para visualizações
- **Themes**: next-themes para dark/light mode

---

## 🚀 **Instalação e Execução**

### **Pré-requisitos**
- Node.js 20+
- npm ou yarn

### **Desenvolvimento Local**

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Acessar aplicação
# http://localhost:3000
```

### **Comandos Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Servidor dev com Turbopack
npm run dev:next         # Servidor dev padrão

# Build & Produção
npm run build            # Build otimizado
npm run start            # Servidor produção
npm run build:analyze    # Análise do bundle

# Qualidade
npm run lint             # ESLint check
npm run lint:fix         # Fix automático
npm run type-check       # TypeScript check
```

---

## 🖥️ **Páginas Implementadas**

### **📊 Dashboard Principal (`/`)**
- **KPIs executivos** - Patrimônio total, alinhamento médio, metas
- **Gráficos interativos** - Distribuição de patrimônio e performance
- **Alertas inteligentes** - Clientes com baixo alinhamento
- **Relatórios avançados** - Análises em tempo real

### **👥 Gestão de Clientes (`/clients`)**
- **Lista paginada** - Busca e filtros avançados
- **Formulário CRUD** - Validação Zod integrada
- **Análise de alinhamento** - Percentuais categorizados por cores
- **Importação CSV** - Upload com progresso SSE em tempo real

### **💼 Portfólio (`/portfolio`)**
- **Visão geral** - Distribuição de classes de ativos
- **Alocação detalhada** - Percentuais e valores
- **Performance tracking** - Histórico de rendimentos
- **Rebalanceamento** - Sugestões automáticas

### **🎯 Metas Financeiras (`/goals`)**
- **CRUD de metas** - Aposentadoria, curto/médio/longo prazo
- **Tracking de progresso** - Percentual de conclusão visual
- **Análise de viabilidade** - Cálculos automáticos
- **Alertas de deadline** - Metas próximas do vencimento

### **📈 Projeções (`/projections`)**
- **Simulador interativo** - Até 2060 com cenários
- **Motor de projeção** - Crescimento composto + eventos
- **Gráficos temporais** - Evolução patrimonial visual
- **Análise de sensibilidade** - Diferentes taxas de retorno

### **📅 Eventos (`/events`)**
- **CRUD eventos** - Depósitos, retiradas, receitas, despesas
- **Frequências flexíveis** - Única, mensal, trimestral, anual
- **Impacto nas projeções** - Integração automática
- **Timeline** - Histórico cronológico

### **🧮 Simulações (`/simulations`)**
- **Histórico** - Cenários salvos e versioning
- **Comparação** - Análise lado a lado
- **Versionamento** - Controle de mudanças
- **Exportação** - Relatórios personalizáveis

### **🛡️ Seguros (`/insurance`)**
- **Gestão de apólices** - Vida, invalidez, saúde, propriedade
- **Análise de cobertura** - Adequação vs patrimônio
- **Distribuição de riscos** - Gráficos de cobertura
- **Alertas** - Insuficiência de cobertura

### **🔐 Autenticação (`/login`)**
- **Login seguro** - JWT com refresh tokens
- **Roles funcionais** - ADVISOR vs VIEWER
- **Proteção de rotas** - Guards automáticos
- **Sessão persistente** - Auto-refresh

---

## 🎨 **Sistema de Design**

### **Tema Dark-Mode Padrão**
```typescript
// Configuração do tema
defaultTheme="dark"
enableSystem={false}
```

### **Cores de Categorização (Conforme Especificação)**
```css
/* Alinhamento Financeiro */
--alignment-excellent: #22c55e;    /* > 90% - Verde */
--alignment-good: #eab308;         /* 90% a 70% - Amarelo-claro */
--alignment-warning: #f59e0b;      /* 70% a 50% - Amarelo-escuro */
--alignment-poor: #ef4444;         /* < 50% - Vermelho */
```

### **Componentes UI (ShadCN/UI)**
- `<Button />` - Botões com variantes
- `<Card />` - Containers de conteúdo
- `<Dialog />` - Modais e formulários
- `<Table />` - Tabelas de dados
- `<Charts />` - Gráficos customizados

---

## 🔗 **Integração com Backend**

### **API Client (`lib/api-client.ts`)**
```typescript
// Configuração base
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000
})

// Interceptadores automáticos
- Request: JWT token injection
- Response: Error handling & toast notifications
```

### **React Query Hooks (`hooks/use-api.ts`)**
```typescript
// Hooks disponíveis
useClients()           // Lista de clientes
useClient(id)          // Cliente específico
useGoals()             // Metas financeiras
useWallets()           // Carteiras/posições
useProjections()       // Simulações
useCSVImport()         // Importação real-time
```

### **Importação CSV em Tempo Real**
```typescript
// SSE com progress tracking
const { progress, upload, status } = useCSVImport(clientId)

// Estados: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
// Progress: { current, total, percentage, message }
```

---

## 📱 **Responsividade**

### **Breakpoints Configurados**
```typescript
sm: '640px'   // Mobile
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large Desktop
2xl: '1536px' // Ultra Wide
```

### **Layout Responsivo**
- **Mobile**: Sidebar colapsável, navegação por abas
- **Tablet**: Layout híbrido, painéis flexíveis
- **Desktop**: Sidebar fixa, múltiplas colunas
- **Zoom**: Responsivo a zoom in/out (especificação)

---

## 🔧 **Configuração Avançada**

### **Next.js Config (`next.config.ts`)**
```typescript
// Configurações de produção
output: 'standalone'     // Docker optimization
images: { unoptimized: true }
experimental: {
  serverComponentsExternalPackages: ['recharts']
}
```

### **Tailwind Config (`tailwind.config.js`)**
```typescript
// Tema customizado
theme: {
  extend: {
    colors: { /* cores do design system */ },
    animation: { /* animações customizadas */ }
  }
}
```

### **ESLint Config (`eslint.config.mjs`)**
```typescript
// Regras configuradas
- @next/next/core-web-vitals
- @typescript-eslint/recommended
- react-hooks/recommended
```

---

## 🐳 **Docker**

### **Dockerfile Multi-stage**
```dockerfile
# Build otimizado para produção
FROM node:20-alpine AS builder
# ... build process

FROM node:20-alpine AS runner
# ... production setup
EXPOSE 3000
CMD ["node", "server.js"]
```

### **Build & Deploy**
```bash
# Local build
npm run build

# Docker build
docker build -t financial-frontend .

# Container run
docker run -p 3000:3000 financial-frontend
```

---

## 🎯 **Funcionalidades Destacadas**

### **✅ Implementadas**
- ✅ **8 páginas completas** com navegação fluida
- ✅ **Dashboard executivo** com KPIs em tempo real
- ✅ **Importação CSV SSE** com progress visual
- ✅ **Formulários validados** com Zod + React Hook Form
- ✅ **Gráficos interativos** com Recharts
- ✅ **Dark mode padrão** conforme especificação
- ✅ **Categorização de cores** exata da spec
- ✅ **Sistema de autenticação** JWT + roles
- ✅ **Estado global** com TanStack Query
- ✅ **Design responsivo** mobile-first

### **🎯 Diferenciais**
- **Real-time updates** com Server-Sent Events
- **Optimistic updates** para melhor UX
- **Error boundaries** com recovery automático
- **Loading states** granulares por componente
- **Toast notifications** contextuais
- **Keyboard navigation** acessibilidade
- **Form auto-save** prevenção de perda de dados

---

## 📊 **Performance**

### **Métricas de Build**
- **Bundle size**: < 2MB (gzipped)
- **First Load JS**: < 300KB
- **Core Web Vitals**: Otimizado

### **Otimizações Implementadas**
```typescript
// Code splitting automático
const LazyComponent = dynamic(() => import('./Component'))

// Image optimization
import Image from 'next/image'

// Bundle analysis
npm run build:analyze
```

---

## 🚀 **Deploy**

### **Vercel (Recomendado)**
```bash
# Deploy automático
vercel --prod
```

### **Docker Compose**
```bash
# Com backend integrado
docker compose up -d frontend
```

### **Build Standalone**
```bash
npm run build
npm start
```

---

**🎨 Frontend moderno, responsivo e production-ready com 8 páginas completas, SSE real-time e design system conforme especificação!**
