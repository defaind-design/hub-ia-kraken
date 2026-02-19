#!/bin/bash
# ============================================================================
# KRAKEN COGNITIVE OS - FIREBASE EMULATOR START SCRIPT
# ============================================================================

echo "🦑 Iniciando Firebase Emulator Suite para Kraken Cognitive OS..."

# Configurações do projeto
PROJECT_ID="hub-ia-kraken"
DATA_DIR="/data/firebase-emulator"
SERVICES="firestore,functions,auth,hosting"

# Verifica se o diretório de dados existe
if [ ! -d "$DATA_DIR" ]; then
  echo "📁 Criando diretório de dados: $DATA_DIR"
  mkdir -p "$DATA_DIR"
fi

# Comando de inicialização
echo "🚀 Iniciando emuladores: $SERVICES"
firebase emulators:start \
  --project="$PROJECT_ID" \
  --only="$SERVICES" \
  --import="$DATA_DIR" \
  --export-on-exit="$DATA_DIR" \
  --ui