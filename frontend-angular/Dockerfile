# ============================================================================
# KRAKEN COGNITIVE OS - DOCKERFILE (Angular Frontend)
# Multi-stage build para produção otimizada
# ============================================================================

# Estágio 1: Build da aplicação Angular
FROM node:18-alpine AS builder

# Configuração do ambiente
WORKDIR /app

# Instala dependências do sistema necessárias
RUN apk add --no-cache python3 make g++ git

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências com cache otimizado
# Usa npm ci se package-lock.json existir, caso contrário usa npm install
# Instala TODAS as dependências (incluindo dev) para build Angular
RUN if [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
else \
    npm install --ignore-scripts; \
fi
RUN npm cache clean --force

# Instala Angular CLI globalmente para build
RUN npm install -g @angular/cli@17

# Copia código fonte (exceto node_modules e dist para evitar conflitos)
COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY src/ ./src/
COPY package*.json ./

# Configuração do Angular para produção
RUN npm run build -- --configuration production

# Estágio 2: Servidor Nginx para produção
FROM nginx:alpine AS production

# Labels para documentação
LABEL maintainer="Paulo Fappi <defaind-design>"
LABEL description="Kraken Cognitive OS - Angular Frontend"
LABEL version="1.0.0"

# Remove configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/*

# Copia configuração customizada do Nginx para o local correto
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados do estágio anterior
COPY --from=builder /app/dist/hub-ia-kraken-angular /usr/share/nginx/html

# Configurações de segurança e permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx && \
    mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 777 /var/log/nginx

# Expõe porta 80 (Nginx padrão)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# Estágio 3: Desenvolvimento (opcional)
# Para desenvolvimento com live-reload
# ============================================================================
FROM node:18-alpine AS development

WORKDIR /app

# Instala Angular CLI globalmente
RUN npm install -g @angular/cli@17

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo dev)
RUN npm install

# Copia código fonte
COPY . .

# Expõe porta de desenvolvimento
EXPOSE 4200

# Comando para desenvolvimento
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--disable-host-check"]