#!/bin/bash

# ============================================================================
# KRAKEN COGNITIVE OS - FIREBASE EMULATOR START SCRIPT
# Script de inicialização do Firebase Emulator Suite
# ============================================================================

set -e

echo "========================================"
echo "   🔥 INICIANDO FIREBASE EMULATOR SUITE"
echo "   Kraken Cognitive OS"
echo "========================================"

# Configuração do projeto Firebase
PROJECT_ID="kraken-dev"
EMULATORS="firestore,functions,auth,hosting"

# Diretório de dados do emulador
DATA_DIR="/data/firebase-emulator"

# Cria diretório de dados se não existir
mkdir -p "$DATA_DIR"

# Verifica se há dados para importar
if [ -d "$DATA_DIR" ] && [ "$(ls -A $DATA_DIR)" ]; then
    echo "📂 Importando dados do emulador de: $DATA_DIR"
    IMPORT_FLAG="--import=$DATA_DIR"
    EXPORT_FLAG="--export-on-exit"
else
    echo "📂 Nenhum dado anterior encontrado, iniciando emulador limpo"
    IMPORT_FLAG=""
    EXPORT_FLAG=""
fi

# Navega para o diretório do projeto
cd /app

# Instala dependências do functions se necessário
if [ -d "functions" ]; then
    echo "📦 Instalando dependências do Cloud Functions..."
    cd functions
    npm ci --only=production --ignore-scripts
    cd ..
fi

# Configura variáveis de ambiente para o emulador
export FIRESTORE_EMULATOR_HOST="0.0.0.0:8080"
export FIREBASE_AUTH_EMULATOR_HOST="0.0.0.0:9099"
export FIREBASE_STORAGE_EMULATOR_HOST="0.0.0.0:9199"
export FIREBASE_DATABASE_EMULATOR_HOST="0.0.0.0:9000"
export HOSTING_EMULATOR_HOST="0.0.0.0:5000"
export PUBSUB_EMULATOR_HOST="0.0.0.0:8085"

# Log das configurações
echo "🔧 Configurações do Emulador:"
echo "   - Projeto: $PROJECT_ID"
echo "   - Emuladores: $EMULATORS"
echo "   - Firestore: $FIRESTORE_EMULATOR_HOST"
echo "   - Auth: $FIREBASE_AUTH_EMULATOR_HOST"
echo "   - Functions: 0.0.0.0:5001"
echo "   - UI: 0.0.0.0:4000"

# Inicia o emulador
echo "🚀 Iniciando Firebase Emulator Suite..."
echo "========================================"

exec firebase emulators:start \
    --project="$PROJECT_ID" \
    --only="$EMULATORS" \
    $IMPORT_FLAG \
    $EXPORT_FLAG \
    --ui \
    --debug

# Nota: Se o comando acima falhar, tente esta alternativa:
# firebase emulators:start --project demo-kraken --only firestore,functions --ui