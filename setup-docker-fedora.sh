#!/bin/bash

# ============================================================================
# KRAKEN COGNITIVE OS - DOCKER INSTALLATION SCRIPT FOR FEDORA
# Instala Docker, Docker Compose e configura ambiente
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
    echo "   🦑 KRAKEN COGNITIVE OS - DOCKER INSTALLATION"
    echo "   Fedora • Docker • Docker Compose"
    echo "================================================================"
    echo -e "${NC}"
}

# Verifica se é Fedora
check_fedora() {
    log_step "Verificando distribuição..."
    
    if [[ ! -f /etc/fedora-release ]]; then
        log_error "Este script é específico para Fedora"
        echo "Distribuição detectada: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
        exit 1
    fi
    
    FEDORA_VERSION=$(cat /etc/fedora-release | grep -o '[0-9]\+')
    log_info "Fedora $FEDORA_VERSION detectado"
}

# Verifica permissões de sudo
check_sudo() {
    log_step "Verificando permissões..."
    
    if [[ $EUID -eq 0 ]]; then
        log_warning "Executando como root. Continuando..."
        return 0
    fi
    
    # Verifica se tem sudo
    if ! command -v sudo &> /dev/null; then
        log_error "sudo não está instalado. Execute como root ou instale sudo."
        exit 1
    fi
    
    # Testa sudo
    if ! sudo -v; then
        log_error "Sem permissões sudo. Execute como root ou configure sudo."
        exit 1
    fi
}

# Verifica Docker atual
check_current_docker() {
    log_step "Verificando instalações atuais..."
    
    # Verifica Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_info "Docker já instalado: $DOCKER_VERSION"
        DOCKER_INSTALLED=true
    else
        log_info "Docker não instalado"
        DOCKER_INSTALLED=false
    fi
    
    # Verifica Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_info "Docker Compose já instalado: $COMPOSE_VERSION"
        COMPOSE_INSTALLED=true
    else
        log_info "Docker Compose não instalado"
        COMPOSE_INSTALLED=false
    fi
    
    # Verifica Podman (alternativa)
    if command -v podman &> /dev/null; then
        PODMAN_VERSION=$(podman --version | cut -d' ' -f3)
        log_info "Podman disponível: $PODMAN_VERSION"
        PODMAN_INSTALLED=true
    else
        PODMAN_INSTALLED=false
    fi
}

# Instala Docker
install_docker() {
    log_step "Instalando Docker..."
    
    # Remove versões antigas se existirem
    log_info "Removendo instalações antigas..."
    sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
    
    # Configura repositório
    log_info "Configurando repositório Docker..."
    sudo dnf -y install dnf-plugins-core
    sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    
    # Instala Docker
    log_info "Instalando Docker Engine..."
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Inicia e habilita Docker
    log_info "Iniciando serviço Docker..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Verifica instalação
    if docker --version &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker $DOCKER_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Docker"
        exit 1
    fi
}

# Instala Podman Compose (recomendado para Fedora)
install_podman_compose() {
    log_step "Instalando Podman Compose..."
    
    # Instala podman-compose via dnf
    log_info "Instalando Podman Compose..."
    sudo dnf install -y podman-compose
    
    # Verifica instalação
    if podman-compose --version &> /dev/null; then
        COMPOSE_VERSION=$(podman-compose --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo "desconhecida")
        log_success "Podman Compose $COMPOSE_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Podman Compose"
        exit 1
    fi
}

# Instala Docker Compose (alternativa)
install_docker_compose_standalone() {
    log_step "Instalando Docker Compose standalone..."
    
    # Instalação manual sem conflitos
    log_info "Baixando Docker Compose standalone..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verifica instalação
    if docker-compose --version &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose $COMPOSE_VERSION instalado manualmente"
    else
        log_error "Falha na instalação do Docker Compose"
        exit 1
    fi
}

# Configura usuário no grupo Docker
configure_user_group() {
    log_step "Configurando permissões do usuário..."
    
    CURRENT_USER=$(whoami)
    
    # Adiciona usuário ao grupo docker
    log_info "Adicionando usuário '$CURRENT_USER' ao grupo docker..."
    sudo usermod -aG docker $CURRENT_USER
    
    # Configurações de socket
    log_info "Configurando socket Docker..."
    sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
    
    log_success "Usuário configurado no grupo Docker"
    log_warning "⚠️  É necessário fazer logout e login novamente para que as alterações tenham efeito"
    log_warning "   Ou execute: newgrp docker"
}

# Testa instalação de containers
test_container_installation() {
    log_step "Testando instalação de containers..."
    
    # Testa runtime
    if [[ $PODMAN_INSTALLED == true ]]; then
        if podman --version &> /dev/null; then
            log_success "✓ Podman funcionando: $(podman --version | cut -d' ' -f3)"
        else
            log_error "✗ Podman não está funcionando"
        fi
        
        # Testa Podman Compose
        if podman-compose --version &> /dev/null; then
            log_success "✓ Podman Compose funcionando"
        else
            log_error "✗ Podman Compose não está funcionando"
        fi
        
        # Testa execução de container
        log_info "Testando execução de container com Podman..."
        if podman run --rm quay.io/podman/hello &> /dev/null; then
            log_success "✓ Containers Podman funcionando corretamente"
        else
            log_warning "⚠️  Containers Podman podem precisar de configuração adicional"
        fi
        
    elif [[ $DOCKER_INSTALLED == true ]]; then
        if docker --version &> /dev/null; then
            log_success "✓ Docker funcionando: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
        else
            log_error "✗ Docker não está funcionando"
        fi
        
        # Testa Docker Compose
        if docker-compose --version &> /dev/null; then
            log_success "✓ Docker Compose funcionando: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
        else
            log_error "✗ Docker Compose não está funcionando"
        fi
        
        # Testa execução de container
        log_info "Testando execução de container com Docker..."
        if docker run --rm hello-world &> /dev/null; then
            log_success "✓ Containers Docker funcionando corretamente"
        else
            log_warning "⚠️  Containers Docker podem precisar de configuração adicional"
        fi
    fi
}

# Configura ambiente Kraken
setup_kraken_environment() {
    log_step "Configurando ambiente Kraken..."
    
    # Cria diretórios de dados
    log_info "Criando diretórios de dados..."
    mkdir -p ./docker-data/firebase-emulator
    mkdir -p ./docker-data/frontend-logs
    
    # Configura permissões
    chmod +x ./docker-start.sh
    chmod +x ./docker-firebase-emulator/start-emulator.sh
    
    log_success "Ambiente Kraken configurado"
}

# Mostra resumo final
show_summary() {
    log_step "INSTALAÇÃO CONCLUÍDA COM SUCESSO 🎉"
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    
    if [[ $PODMAN_INSTALLED == true ]]; then
        echo -e "${GREEN}   ✅ PODMAN CONFIGURADO NO FEDORA${NC}"
        echo -e "${GREEN}   (Solução nativa sem conflitos)${NC}"
    else
        echo -e "${GREEN}   ✅ DOCKER INSTALADO NO FEDORA${NC}"
    fi
    
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    echo -e "${CYAN}📊 RESUMO DA INSTALAÇÃO:${NC}"
    
    if [[ $PODMAN_INSTALLED == true ]]; then
        echo "  • Podman: $(podman --version 2>/dev/null | cut -d' ' -f3 || echo 'NÃO INSTALADO')"
        echo "  • Podman Compose: $(podman-compose --version 2>/dev/null | head -1 | cut -d' ' -f3 || echo 'NÃO INSTALADO')"
        echo "  • Usuário: $(whoami) (Podman não requer grupo especial)"
    else
        echo "  • Docker: $(docker --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo 'NÃO INSTALADO')"
        echo "  • Docker Compose: $(docker-compose --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo 'NÃO INSTALADO')"
        echo "  • Usuário: $(whoami) (adicionado ao grupo docker)"
    fi
    
    echo ""
    
    if [[ $DOCKER_INSTALLED == true ]]; then
        echo -e "${YELLOW}⚠️  ATENÇÃO IMPORTANTE (Docker):${NC}"
        echo "  Para que as alterações de grupo tenham efeito, você precisa:"
        echo "  1. Fazer LOGOUT e LOGIN novamente"
        echo "  2. OU executar: ${GREEN}newgrp docker${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ VANTAGEM PODMAN:${NC}"
        echo "  • Não requer configuração de grupo"
        echo "  • Rootless por padrão (mais seguro)"
        echo "  • Nativo do Fedora (sem conflitos)"
        echo ""
    fi
    
    echo -e "${BLUE}🚀 PRÓXIMOS PASSOS PARA O KRAKEN:${NC}"
    
    if [[ $DOCKER_INSTALLED == true ]]; then
        echo "  1. Execute: ${GREEN}newgrp docker${NC} (ou faça logout/login)"
    else
        echo "  1. Podman já está pronto para uso"
    fi
    
    echo "  2. Execute: ${GREEN}./docker-start.sh${NC}"
    echo "  3. Selecione opção 1 (Iniciar ambiente completo)"
    echo "  4. Acesse: ${CYAN}http://localhost:7000${NC}"
    echo ""
    
    echo -e "${PURPLE}🦑 O KRAKEN ESTÁ PRONTO PARA DECOLAR!${NC}"
    echo ""
}

# Função principal
main() {
    print_banner
    check_fedora
    check_sudo
    check_current_docker
    
    # Decisão inteligente baseada no ambiente
    if [[ $PODMAN_INSTALLED == true ]]; then
        log_info "Podman detectado - usando solução nativa do Fedora"
        
        # Instala Podman Compose (recomendado para Fedora)
        if ! command -v podman-compose &> /dev/null; then
            install_podman_compose
        else
            log_info "Podman Compose já instalado"
        fi
        
        log_success "Ambiente Podman configurado (nativo do Fedora)"
        
    elif [[ $DOCKER_INSTALLED == true ]]; then
        log_info "Docker detectado - usando Docker oficial"
        
        # Instala Docker Compose standalone (evita conflitos)
        if ! command -v docker-compose &> /dev/null; then
            install_docker_compose_standalone
        else
            log_info "Docker Compose já instalado"
        fi
        
        # Configura grupo Docker apenas se for Docker
        configure_user_group
        
    else
        log_info "Nenhum runtime detectado - instalando Podman (nativo do Fedora)"
        
        # Instala Podman (nativo, sem conflitos)
        sudo dnf install -y podman podman-compose
        
        PODMAN_INSTALLED=true
        log_success "Podman instalado como runtime nativo do Fedora"
    fi
    
    # Testa instalação
    test_container_installation
    setup_kraken_environment
    show_summary
}

# Execução
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi