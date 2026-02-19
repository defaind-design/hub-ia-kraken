#!/bin/bash

# ============================================================================
# KRAKEN COGNITIVE OS - SETUP SCRIPT
# Auto-instalador para Fedora, Ubuntu/Debian, Arch Linux e macOS
# Autor: Paulo Fappi (Leonino Resiliente)
# Versão: 1.0.0
# ============================================================================

set -e  # Sai no primeiro erro

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

log_debug() {
    echo -e "${CYAN}[DEBUG]${NC} $1"
}

# Banner do Kraken
print_banner() {
    echo -e "${PURPLE}"
    echo "================================================================"
    echo "   🦑 KRAKEN COGNITIVE OPERATING SYSTEM - SETUP"
    echo "   Modular Blackboard Architecture • Angular 17 • Firebase"
    echo "================================================================"
    echo -e "${NC}"
}

# Detecção do sistema operacional
detect_os() {
    log_step "Detectando sistema operacional..."
    
    if [[ -f /etc/fedora-release ]]; then
        OS="fedora"
        OS_VERSION=$(cat /etc/fedora-release | grep -o '[0-9]\+')
        log_info "Fedora $OS_VERSION detectado"
        
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        if [[ -f /etc/lsb-release ]]; then
            . /etc/lsb-release
            OS="ubuntu"
            OS_VERSION=$DISTRIB_RELEASE
            log_info "Ubuntu $OS_VERSION detectado"
        else
            OS_VERSION=$(cat /etc/debian_version)
            log_info "Debian $OS_VERSION detectado"
        fi
        
    elif [[ -f /etc/arch-release ]]; then
        OS="arch"
        log_info "Arch Linux detectado"
        
    elif [[ "$(uname)" == "Darwin" ]]; then
        OS="macos"
        OS_VERSION=$(sw_vers -productVersion)
        log_info "macOS $OS_VERSION detectado"
        
    else
        log_error "Sistema operacional não suportado"
        exit 1
    fi
}

# Verificação de permissões
check_permissions() {
    log_step "Verificando permissões..."
    
    if [[ $EUID -eq 0 ]]; then
        log_warning "Executando como root. Isso pode causar problemas de permissão."
        read -p "Deseja continuar? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            log_info "Execute o script sem sudo: ./setup-kraken-environment.sh"
            exit 1
        fi
    fi
    
    # Verifica se temos acesso ao diretório atual
    if [[ ! -w . ]]; then
        log_error "Sem permissão de escrita no diretório atual"
        exit 1
    fi
}

# Instalação do Node.js (Fedora)
install_node_fedora() {
    log_step "Instalando Node.js 22.x no Fedora..."
    
    # Verifica se já tem Node.js instalado
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js já instalado: $NODE_VERSION"
        
        # Verifica se é versão 18+
        if [[ ${NODE_VERSION:1:2} -lt 18 ]]; then
            log_warning "Node.js $NODE_VERSION detectado. Recomendado: 18+"
            read -p "Deseja atualizar para Node.js 22? (s/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                sudo dnf remove -y nodejs npm
            else
                return 0
            fi
        else
            return 0
        fi
    fi
    
    # Instala Node.js 22.x
    log_info "Adicionando repositório NodeSource..."
    sudo dnf install -y curl
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
    
    log_info "Instalando Node.js e npm..."
    sudo dnf install -y nodejs
    
    # Verifica instalação
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    if [[ $? -eq 0 ]]; then
        log_success "Node.js $NODE_VERSION instalado com sucesso"
        log_success "npm $NPM_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Node.js"
        exit 1
    fi
}

# Instalação do Node.js (Ubuntu/Debian)
install_node_debian() {
    log_step "Instalando Node.js 22.x no Ubuntu/Debian..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js já instalado: $NODE_VERSION"
        
        if [[ ${NODE_VERSION:1:2} -lt 18 ]]; then
            log_warning "Node.js $NODE_VERSION detectado. Recomendado: 18+"
            read -p "Deseja atualizar para Node.js 22? (s/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                sudo apt remove -y nodejs npm
            else
                return 0
            fi
        else
            return 0
        fi
    fi
    
    log_info "Adicionando repositório NodeSource..."
    sudo apt update
    sudo apt install -y curl ca-certificates gnupg
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
    
    log_info "Instalando Node.js e npm..."
    sudo apt install -y nodejs
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    if [[ $? -eq 0 ]]; then
        log_success "Node.js $NODE_VERSION instalado com sucesso"
        log_success "npm $NPM_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Node.js"
        exit 1
    fi
}

# Instalação do Node.js (Arch)
install_node_arch() {
    log_step "Instalando Node.js no Arch Linux..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js já instalado: $NODE_VERSION"
        return 0
    fi
    
    sudo pacman -Sy --noconfirm nodejs npm
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    if [[ $? -eq 0 ]]; then
        log_success "Node.js $NODE_VERSION instalado com sucesso"
        log_success "npm $NPM_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Node.js"
        exit 1
    fi
}

# Instalação do Node.js (macOS)
install_node_macos() {
    log_step "Instalando Node.js no macOS..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "Node.js já instalado: $NODE_VERSION"
        return 0
    fi
    
    # Verifica se Homebrew está instalado
    if ! command -v brew &> /dev/null; then
        log_info "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    brew install node
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    if [[ $? -eq 0 ]]; then
        log_success "Node.js $NODE_VERSION instalado com sucesso"
        log_success "npm $NPM_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Node.js"
        exit 1
    fi
}

# Instalação do Angular CLI
install_angular_cli() {
    log_step "Instalando Angular CLI..."
    
    if command -v ng &> /dev/null; then
        NG_VERSION=$(ng version 2>/dev/null | grep "Angular CLI" | awk '{print $3}' || echo "desconhecido")
        log_info "Angular CLI já instalado: $NG_VERSION"
        
        # Verifica se precisa atualizar
        if [[ $NG_VERSION != "desconhecido" ]]; then
            MAJOR_VERSION=$(echo $NG_VERSION | cut -d. -f1)
            if [[ $MAJOR_VERSION -lt 17 ]]; then
                log_warning "Angular CLI $NG_VERSION detectado. Recomendado: 17+"
                read -p "Deseja atualizar para Angular CLI 17? (s/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Ss]$ ]]; then
                    npm uninstall -g @angular/cli
                    npm cache clean --force
                else
                    return 0
                fi
            else
                return 0
            fi
        fi
    fi
    
    log_info "Instalando Angular CLI globalmente..."
    npm install -g @angular/cli@17
    
    if [[ $? -eq 0 ]]; then
        NG_VERSION=$(ng version 2>/dev/null | grep "Angular CLI" | awk '{print $3}' || echo "17.x")
        log_success "Angular CLI $NG_VERSION instalado com sucesso"
    else
        log_error "Falha na instalação do Angular CLI"
        log_info "Tentando com permissões elevadas..."
        sudo npm install -g @angular/cli@17 --unsafe-perm=true --allow-root
    fi
}

# Configuração do projeto Angular
setup_angular_project() {
    log_step "Configurando projeto Angular..."
    
    if [[ ! -d "frontend-angular" ]]; then
        log_error "Diretório frontend-angular não encontrado"
        exit 1
    fi
    
    cd frontend-angular
    
    # Backup do package.json se existir
    if [[ -f "package.json" ]]; then
        cp package.json package.json.backup
        log_info "Backup do package.json criado"
    fi
    
    # Instala dependências
    log_info "Instalando dependências do projeto..."
    
    # Tenta instalação normal primeiro
    if npm install; then
        log_success "Dependências instaladas com sucesso"
    else
        log_warning "Problemas com dependências, tentando com --legacy-peer-deps..."
        
        if npm install --legacy-peer-deps; then
            log_success "Dependências instaladas com --legacy-peer-deps"
        else
            log_error "Falha na instalação das dependências"
            log_info "Tentando limpar cache e reinstalar..."
            npm cache clean --force
            rm -rf node_modules package-lock.json
            
            if npm install --legacy-peer-deps; then
                log_success "Dependências instaladas após limpeza de cache"
            else
                log_error "Não foi possível instalar dependências"
                log_info "Restaurando backup do package.json..."
                mv package.json.backup package.json
                exit 1
            fi
        fi
    fi
    
    # Verifica se angular.json existe
    if [[ ! -f "angular.json" ]]; then
        log_error "angular.json não encontrado. Projeto Angular inválido."
        exit 1
    fi
    
    cd ..
}

# Teste do build
test_build() {
    log_step "Testando build do projeto..."
    
    cd frontend-angular
    
    log_info "Executando build de desenvolvimento..."
    if npx ng build; then
        log_success "Build de desenvolvimento concluído com sucesso"
    else
        log_warning "Build de desenvolvimento falhou, tentando com configuração simplificada..."
        
        # Tenta build com configuração de produção
        if npx ng build --configuration production; then
            log_success "Build de produção concluído com sucesso"
        else
            log_error "Build falhou. Verifique os erros acima."
            exit 1
        fi
    fi
    
    cd ..
}

# Configuração do servidor de desenvolvimento
setup_dev_server() {
    log_step "Configurando servidor de desenvolvimento..."
    
    # Cria script de inicialização
    cat > start-kraken.sh << 'EOF'
#!/bin/bash

# Script de inicialização do Kraken Cognitive OS

set -e

echo "========================================"
echo "   🦑 INICIANDO KRAKEN COGNITIVE OS"
echo "   Porta: 4200"
echo "   Ambiente: Desenvolvimento"
echo "========================================"

cd frontend-angular

# Verifica se a porta 4200 está disponível
if command -v lsof &> /dev/null; then
    if lsof -ti:4200 &> /dev/null; then
        echo "⚠️  Aviso: Porta 4200 já em uso"
        echo "Tentando porta 4201..."
        npx ng serve --port 4201 --open
    else
        npx ng serve --port 4200 --open
    fi
else
    # Se lsof não estiver disponível, tenta a porta 4200
    npx ng serve --port 4200 --open
fi
EOF
    
    chmod +x start-kraken.sh
    
    # Cria script de produção
    cat > build-prod.sh << 'EOF'
#!/bin/bash

# Script de build de produção do Kraken

set -e

echo "========================================"
echo "   🏗️  BUILD DE PRODUÇÃO KRAKEN OS"
echo "========================================"

cd frontend-angular

# Limpa builds anteriores
rm -rf dist/

# Executa build de produção
npx ng build --configuration production

echo "✅ Build concluído: frontend-angular/dist/"
echo "📁 Tamanho total: $(du -sh dist/ | cut -f1)"
EOF
    
    chmod +x build-prod.sh
    
    log_success "Scripts de inicialização criados:"
    log_info "  ./start-kraken.sh    - Inicia servidor de desenvolvimento"
    log_info "  ./build-prod.sh      - Executa build de produção"
}

# Verificação final
final_check() {
    log_step "Realizando verificação final..."
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}   ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Verifica Node.js
    if command -v node &> /dev/null; then
        echo -e "✓ Node.js: $(node --version)"
    else
        echo -e "✗ Node.js: NÃO INSTALADO"
    fi
    
    # Verifica npm
    if command -v npm &> /dev/null; then
        echo -e "✓ npm: $(npm --version)"
    else
        echo -e "✗ npm: NÃO INSTALADO"
    fi
    
    # Verifica Angular CLI
    if command -v ng &> /dev/null; then
        echo -e "✓ Angular CLI: Disponível"
    else
        echo -e "✗ Angular CLI: NÃO INSTALADO"
    fi
    
    # Verifica dependências do projeto
    if [[ -d "frontend-angular/node_modules" ]]; then
        echo -e "✓ Dependências: Instaladas"
    else
        echo -e "✗ Dependências: NÃO INSTALADAS"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
    echo "1. Execute: ./start-kraken.sh"
    echo "2. Acesse: http://localhost:4200"
    echo "3. Para build de produção: ./build-prod.sh"
    echo ""
    echo -e "${BLUE}🦑 O KRAKEN ESTÁ PRONTO PARA AÇÃO!${NC}"
    echo ""
}

# Função principal
main() {
    print_banner
    detect_os
    check_permissions
    
    # Instala Node.js baseado no OS
    case $OS in
        "fedora")
            install_node_fedora
            ;;
        "ubuntu"|"debian")
            install_node_debian
            ;;
        "arch")
            install_node_arch
            ;;
        "macos")
            install_node_macos
            ;;
    esac
    
    install_angular_cli
    setup_angular_project
    test_build
    setup_dev_server
    final_check
}

# Tratamento de erros
trap 'log_error "Script interrompido pelo usuário"; exit 1' INT TERM

# Execução principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
