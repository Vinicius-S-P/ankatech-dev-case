## 📋 **Visão Geral**

Interface moderna desenvolvida com **Next.js 14** (App Router) para o sistema de planejamento financeiro Multi Family Office. Oferece dashboard executivo, gestão completa de clientes e portfólios, projeções interativas até 2060 e importação CSV em tempo real.

### **🔧 Stack Técnica**
- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: ShadCN/UI + Tailwind CSS (dark-mode default)
- **Forms**: React-Hook-Form + Zod validation
- **HTTP Client**: Axios com interceptadores
- **Charts**: Recharts para visualizações

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

### **👥 Gestão de Clientes (`/clients`)**
- **Lista paginada** - Busca e filtros avançados
- **Formulário CRUD** - Validação Zod integrada
- **Análise de alinhamento** - Percentuais categorizados por cores

### **💼 Portfólio (`/portfolio`)**
- **Visão geral** - Distribuição de classes de ativos
- **Alocação detalhada** - Percentuais e valores

### **🎯 Metas Financeiras (`/goals`)**
- **CRUD de metas** - Aposentadoria, curto/médio/longo prazo
- **Tracking de progresso** - Percentual de conclusão visual
- **Alertas de deadline** - Metas próximas do vencimento

### **📈 Projeções (`/projections`)**
- **Simulador interativo** - Até 2060 com cenários
- **Motor de projeção** - Crescimento composto + eventos
- **Gráficos temporais** - Evolução patrimonial visual

### **📅 Eventos (`/events`)**
- **CRUD eventos** - Depósitos, retiradas, receitas, despesas
- **Frequências flexíveis** - Única, mensal, trimestral, anual
- **Impacto nas projeções** - Integração automática
- **Timeline** - Histórico cronológico

### **🧮 Simulações (`/simulations`)**
- **Histórico** - Cenários salvos e versioning

### **🛡️ Seguros (`/insurance`)**
- **Gestão de apólices** - Vida, invalidez, saúde, propriedade

### **🔐 Autenticação (`/login`)**
- **Login seguro** - JWT com refresh tokens
- **Roles funcionais** - ADVISOR vs VIEWER
- **Proteção de rotas** - Guards automáticos
- **Sessão persistente** - Auto-refresh