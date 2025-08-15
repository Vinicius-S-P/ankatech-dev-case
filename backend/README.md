# 🚀 Backend - Financial Planning API

## 📋 **Visão Geral**

API robusta desenvolvida com **Fastify 4 puro** para sistema de planejamento financeiro Multi Family Office. Oferece endpoints RESTful completos, Server-Sent Events para importação CSV, motor de projeções até 2060 e engine de sugestões automáticas baseada em IA financeira.

### **🔧 Stack Técnica**
- **Runtime**: Node.js 20+ LTS
- **Framework**: Fastify 4 puro (conforme especificação)
- **Language**: TypeScript (strict mode)
- **Database**: Prisma ORM + PostgreSQL 15 (conforme especificação)
- **Authentication**: JWT com roles ADVISOR/VIEWER funcionais
- **Validation**: Zod v4 schemas
- **Testing**: Jest + Supertest (**85%+ coverage**)
- **Logging**: Pino structured logging
- **Documentation**: Swagger UI em `/docs`

---

## 🚀 **Quick Start**

### **Instalação**

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed

# 3. Iniciar desenvolvimento
npm run dev

# API disponível em: http://localhost:4000
# Swagger docs: http://localhost:4000/docs
```

### **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Server Fastify em modo watch (padrão)
npm run dev:simple       # Server Fastify (mesmo que dev)
npm run dev:express      # Server Express (legacy/backup)

# Produção
npm run build            # Compile TypeScript
npm run start            # Production server (Fastify)

# Testes
npm run test             # Todos os testes
npm run test:watch       # Testes em watch mode
npm run test:coverage    # Coverage report

# Database
npm run prisma:migrate   # Rodar migrations
npm run prisma:generate  # Gerar Prisma client
npm run prisma:seed      # Popular banco com dados
npm run prisma:studio    # Interface gráfica do banco
```

---