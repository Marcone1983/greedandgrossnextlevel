#!/bin/bash

echo "🚀 GREED & GROSS - Push to GitHub Repository"
echo "============================================"

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Chiedi conferma delle informazioni
echo ""
read -p "GitHub username: " GITHUB_USER
read -p "Repository name: " REPO_NAME

REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"

print_info "Configurazione repository..."
echo "URL: $REPO_URL"
echo ""

# Rimuovi remote esistente se presente
git remote remove origin 2>/dev/null || true

# Aggiungi nuovo remote
git remote add origin "$REPO_URL"

print_info "Tentativo di push..."

# Prova il push
if git push -u origin main; then
    print_status "Push completato con successo!"
    echo ""
    echo "🎉 Repository online: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo ""
    print_info "Prossimi passi:"
    echo "1. Configura GitHub Secrets: ./scripts/setup-github-secrets.sh"
    echo "2. Genera keystore Android: ./scripts/generate-keystore.sh" 
    echo "3. Verifica configurazione: ./scripts/verify-secrets.sh"
    echo ""
else
    print_error "Push fallito!"
    echo ""
    echo "Possibili soluzioni:"
    echo "1. Verifica che il repository esista: https://github.com/$GITHUB_USER/$REPO_NAME"
    echo "2. Controlla che il nome utente sia corretto"
    echo "3. Assicurati di avere i permessi di scrittura"
    echo "4. Se il repository ha già contenuto, prova:"
    echo "   git pull origin main --allow-unrelated-histories"
    echo "   git push origin main"
fi