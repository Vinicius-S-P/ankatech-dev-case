# Guia: Subir os containers (Backend, Frontend e Banco)

Este guia explica como construir e subir os serviços do projeto utilizando Docker Compose.

## Pre-requisitos
- Docker e Docker Compose instalados
- Terminal posicionado em `financial-dashboard`

Verifique as versões:

```bash
docker --version
docker compose version
```

## Servicos
- Banco de dados: PostgreSQL 15 (rede interna do Compose, sem porta exposta por padrao)
- Backend: Node.js (Fastify), exposto em `http://localhost:4000`
- Frontend: Next.js, exposto em `http://localhost:3000`

## Subir tudo (build + up)
```bash
# No diretorio financial-dashboard
docker compose up -d --build
```

Acompanhar status:
```bash
docker compose ps
```

Ver logs (opcional):
```bash
docker compose logs -f db
docker compose logs -f backend
docker compose logs -f frontend
```

## Health checks rapidos
- Backend: `http://localhost:4000/health`

```bash
curl http://localhost:4000/health
```

- Frontend: `http://localhost:3000`

```bash
curl -I http://localhost:3000
```

## Migrations do banco (Prisma)
Aplicar migrations no banco dentro do container do backend:
```bash
docker compose exec backend npx prisma migrate deploy
```

## Seed de dados (opcional)
O seed atual esta em TypeScript (`prisma/seed.ts`). Para executar dentro do container (instalacao temporaria):
```bash
docker compose exec backend sh -lc "npm i -D ts-node && npx ts-node prisma/seed.ts"
```

Observacao: essa instalacao ocorre apenas no container em execucao. Em um fluxo de producao, prefira adaptar o processo de seed para rodar sem `ts-node` ou incluir a ferramenta na imagem de forma controlada.

## Parar e remover
Parar containers:
```bash
docker compose down
```

Parar e remover volume de dados (reset do banco):
```bash
docker compose down -v
```

## Expor o banco para o host (opcional)
Por padrao o Postgres nao esta exposto para evitar conflito de portas. Se precisar acessar o banco a partir do host, adicione o mapeamento de porta em `docker-compose.yml` no servico `db`:

```yaml
db:
  image: postgres:15
  container_name: financial-db
  environment:
    POSTGRES_USER: planner
    POSTGRES_PASSWORD: plannerpw
    POSTGRES_DB: plannerdb
  volumes:
    - pg_data:/var/lib/postgresql/data
  ports:
    - "5433:5432"  # expose Postgres on host port 5433
  networks:
    - financial-network
  restart: unless-stopped
```

Depois reaplique:
```bash
docker compose up -d db
```

## Solucao de problemas
- Portas ocupadas (3000/4000):
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN || true
lsof -nP -iTCP:4000 -sTCP:LISTEN || true
```

- Reconstruir imagens do zero:
```bash
docker compose build --no-cache
docker compose up -d
```

- Limpar volumes e reiniciar banco (perde dados):
```bash
docker compose down -v
```

## Endpoints uteis
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Backend health: `http://localhost:4000/health`

---
Para duvidas ou erros especificos, verifique os logs dos servicos (`docker compose logs -f <servico>`) e confirme as variaveis de ambiente definidas no `docker-compose.yml`.
