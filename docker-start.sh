#!/bin/bash

# ============================================================================
# KRAKEN COGNITIVE OS - DOCKER START SCRIPT
# Script para facilitar o gerenciamento do ambiente Docker
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Funções de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Banner do Kraken
print_banner() {
    echo -e "${PURPLE}"
    echo "================================================================"
    echo "   🦑 KRAKEN COGNITIVE OS - DOCKER ENVIRONMENT"
    echo "   Porta: 7000 • Firebase Emulator: 4000"
    echo "================================================================"
    echo -e "${NC}"
}

# Verifica se Docker/Podman está instalado
check_container_runtime() {
    log_step "Verificando ambiente de containers..."
    
    # Detectar runtime de containers
    if command -v podman &> /dev/null; then
        CONTAINER_RUNTIME="podman"
        RUNTIME_VERSION=$(podman --version | cut -d' ' -f3)
        log_info "Podman detectado: $RUNTIME_VERSION"
    elif command -v docker &> /dev/null; then
        CONTAINER_RUNTIME="docker"
        RUNTIME_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_info "Docker detectado: $RUNTIME_VERSION"
    else
        log_error "Nenhum runtime de containers encontrado (Docker ou Podman)"
        echo "Instale Docker: https://docs.docker.com/get-docker/"
        echo "OU Podman (nativo do Fedora): sudo dnf install podman"
        exit 1
    fi
    
    # Detectar compose
    if command -v podman-compose &> /dev/null; then
        COMPOSE_CMD="podman-compose"
        COMPOSE_VERSION=$(podman-compose --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo "desconhecida")
        log_success "Podman Compose disponível: $COMPOSE_VERSION"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose disponível: $COMPOSE_VERSION"
    else
        log_error "Nenhum comando compose encontrado (docker-compose ou podman-compose)"
        
        if [[ $CONTAINER_RUNTIME == "podman" ]]; then
            echo "Instale Podman Compose: sudo dnf install podman-compose"
        else
            echo "Instale Docker Compose: https://docs.docker.com/compose/install/"
        fi
        exit 1
    fi
    
    log_success "Ambiente configurado: $CONTAINER_RUNTIME com $COMPOSE_CMD"
}

# Cria diretórios necessários
create_directories() {
    log_step "Criando diretórios de dados..."
    
    mkdir -p ./docker-data/firebase-emulator
    mkdir -p ./docker-data/frontend-logs
    
    log_success "Diretórios criados:"
    log_info "  ./docker-data/firebase-emulator"
    log_info "  ./docker-data/frontend-logs"
}

# Build das imagens
build_images() {
    log_step "Buildando imagens..."
    
    log_info "Buildando Kraken Frontend (Angular)..."
    $COMPOSE_CMD build kraken-frontend
    
    log_info "Buildando Firebase Emulator..."
    $COMPOSE_CMD build firebase-emulator
    
    log_success "Imagens buildadas com sucesso usando $COMPOSE_CMD"
}

# Inicia todos os serviços
start_services() {
    log_step "Iniciando serviços..."
    
    $COMPOSE_CMD up -d
    
    log_success "Serviços iniciados em background"
    log_info "Verificando status dos serviços..."
    
    sleep 5
    
    # Verifica status dos containers
    $COMPOSE_CMD ps
}

# Para todos os serviços
stop_services() {
    log_step "Parando serviços..."
    
    $COMPOSE_CMD down
    
    log_success "Serviços parados e containers removidos"
}

# Remove tudo (containers, volumes, imagens)
clean_all() {
    log_step "Limpando ambiente completamente..."
    
    read -p "Tem certeza que deseja remover TUDO (containers, volumes, imagens)? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        log_info "Operação cancelada"
        return
    fi
    
    $COMPOSE_CMD down -v
    
    if [[ $CONTAINER_RUNTIME == "docker" ]]; then
        docker system prune -a -f
    elif [[ $CONTAINER_RUNTIME == "podman" ]]; then
        podman system prune -a -f
    fi
    
    log_success "Ambiente completamente limpo"
}

# Mostra logs dos serviços
show_logs() {
    log_step "Mostrando logs dos serviços..."
    
    echo "Selecione o serviço:"
    echo "1. Kraken Frontend (Angular)"
    echo "2. Firebase Emulator"
    echo "3. Todos os serviços"
    echo "4. Logs em tempo real (follow)"
    read -p "Opção: " option
    
    case $option in
        1)
            $COMPOSE_CMD logs kraken-frontend
            ;;
        2)
            $COMPOSE_CMD logs firebase-emulator
            ;;
        3)
            $COMPOSE_CMD logs
            ;;
        4)
            $COMPOSE_CMD logs -f
            ;;
        *)
            log_error "Opção inválida"
            ;;
    esac
}

# Acesso ao shell dos containers
access_shell() {
    log_step "Acesso ao shell dos containers..."
    
    echo "Selecione o container:"
    echo "1. Kraken Frontend (Angular)"
    echo "2. Firebase Emulator"
    read -p "Opção: " option
    
    case $option in
        1)
            $COMPOSE_CMD exec kraken-frontend sh
            ;;
        2)
            $COMPOSE_CMD exec firebase-emulator sh
            ;;
        *)
            log_error "Opção inválida"
            ;;
    esac
}

# Status dos serviços
show_status() {
    log_step "Status dos serviços..."
    
    $COMPOSE_CMD ps
    
    echo ""
    echo -e "${CYAN}📡 ENDPOINTS DISPONÍVEIS:${NC}"
    echo "  Frontend Angular:    http://localhost:7000"
    echo "  Firebase Emulator UI: http://localhost:4000"
    echo "  Firestore Emulator:  http://localhost:8080"
    echo "  Functions Emulator:  http://localhost:5001"
    echo "  Auth Emulator:       http://localhost:9099"
    echo ""
    echo -e "${YELLOW}📋 COMANDOS ÚTEIS:${NC}"
    echo "  ./docker-start.sh logs     - Mostra logs"
    echo "  ./docker-start.sh shell    - Acesso ao shell"
    echo "  ./docker-start.sh stop     - Para serviços"
    echo "  ./docker-start.sh clean    - Limpa tudo"
    echo ""
    echo -e "${GREEN}🔧 AMBIENTE ATUAL: $CONTAINER_RUNTIME com $COMPOSE_CMD${NC}"
    echo ""
}

# Menu principal
show_menu() {
    print_banner
    
    echo "Selecione uma opção:"
    echo "1. 🚀 Iniciar ambiente completo (build + start)"
    echo "2. ⚡ Iniciar serviços (apenas start)"
    echo "3. 🛑 Parar serviços"
    echo "4. 📜 Mostrar logs"
    echo "5. 🐚 Acessar shell do container"
    echo "6. 📊 Ver status e endpoints"
    echo "7. 🧹 Limpar ambiente completamente"
    echo "8. ❌ Sair"
    echo ""
    read -p "Opção: " option
    
    case $option in
        1)
            check_container_runtime
            create_directories
            build_images
            start_services
            show_status
            ;;
        2)
            check_container_runtime
            start_services
            show_status
            ;;
        3)
            check_container_runtime
            stop_services
            ;;
        4)
            check_container_runtime
            show_logs
            ;;
        5)
            check_container_runtime
            access_shell
            ;;
        6)
            check_container_runtime
            show_status
            ;;
        7)
            check_container_runtime
            clean_all
            ;;
        8)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida"
            ;;
    esac
}

# Modo de linha de comando
if [[ $# -gt 0 ]]; then
    case $1 in
        "start")
            check_container_runtime
            create_directories
            build_images
            start_services
            show_status
            ;;
        "stop")
            check_container_runtime
            stop_services
            ;;
        "logs")
            check_container_runtime
            show_logs
            ;;
        "shell")
            check_container_runtime
            access_shell
            ;;
        "status")
            check_container_runtime
            show_status
            ;;
        "clean")
            check_container_runtime
            clean_all
            ;;
        "build")
            check_container_runtime
            build_images
            ;;
        *)
            log_error "Comando inválido: $1"
            echo "Comandos disponíveis: start, stop, logs, shell, status, clean, build"
            exit 1
            ;;
    esac
else
    # Modo interativo
    show_menu
fi
