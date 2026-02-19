# ============================================================================
# KRAKEN COGNITIVE OS - FIREBASE EMULATOR DOCKERFILE
# Container com Firebase Emulator Suite completo
# ============================================================================

FROM node:18-alpine

# Labels para documentação
LABEL maintainer="Paulo Fappi <defaind-design>"
LABEL description="Kraken Cognitive OS - Firebase Emulator Suite"
LABEL version="1.0.0"

# Configuração do ambiente
WORKDIR /app

# Instala dependências do sistema
RUN apk add --no-cache python3 make g++ git openjdk11-jre bash curl

# Instala Firebase CLI globalmente
RUN npm install -g firebase-tools@12.0.0

# Copia arquivos do projeto (contexto na raiz)
COPY ./functions/ ./functions/
COPY ./firebase.json ./
COPY ./firestore.rules ./
COPY ./firestore.indexes.json ./

# Cria diretório para dados do emulador
RUN mkdir -p /data/firebase-emulator

# Configura variáveis de ambiente
ENV FIRESTORE_EMULATOR_HOST=0.0.0.0:8080
ENV FIREBASE_AUTH_EMULATOR_HOST=0.0.0.0:9099
ENV FIREBASE_STORAGE_EMULATOR_HOST=0.0.0.0:9199
ENV FIREBASE_DATABASE_EMULATOR_HOST=0.0.0.0:9000
ENV HOSTING_EMULATOR_HOST=0.0.0.0:5000
ENV PUBSUB_EMULATOR_HOST=0.0.0.0:8085

# Portas expostas
# 4000: Firebase Emulator UI
# 8080: Firestore Emulator
# 5001: Functions Emulator
# 9099: Auth Emulator
# 9199: Storage Emulator
# 9000: Database Emulator
# 5000: Hosting Emulator
# 8085: Pub/Sub Emulator
EXPOSE 4000 8080 5001 9099 9199 9000 5000 8085

# Health check para verificar se o emulador está rodando
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4000 || exit 1

# Script de inicialização
COPY ./start-emulator.sh /app/start-emulator.sh
RUN chmod +x /app/start-emulator.sh

# Comando de inicialização
CMD ["/app/start-emulator.sh"]

# Comando alternativo para shell interativo
# CMD ["firebase", "emulators:start", "--project", "kraken-dev", "--only", "firestore,functions,auth,hosting", "--import", "/data/firebase-emulator", "--export-on-exit"]