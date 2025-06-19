#!/bin/bash

# GREED & GROSS - GitHub Secrets Setup Script
# Questo script configura automaticamente tutti i secrets necessari per GitHub Actions

set -e

echo "🌿 GREED & GROSS - GitHub Secrets Setup"
echo "========================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verifica che gh CLI sia installato
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI non trovato!"
    echo ""
    echo "Installa GitHub CLI:"
    echo "  macOS: brew install gh"
    echo "  Ubuntu: sudo apt install gh"
    echo "  Windows: winget install GitHub.cli"
    echo ""
    exit 1
fi

# Verifica autenticazione
if ! gh auth status &> /dev/null; then
    print_warning "Non sei autenticato con GitHub"
    echo ""
    print_info "Avvio autenticazione..."
    gh auth login
    echo ""
fi

echo "🔐 Configurazione GitHub Secrets in corso..."
echo ""

# Firebase Secrets
print_info "Configurazione Firebase secrets..."
gh secret set FIREBASE_API_KEY --body "AIzaSyBvOyiDlEcFqTdDjMjp5K8L9nN2mR3oP4q" 2>/dev/null && print_status "FIREBASE_API_KEY"
gh secret set FIREBASE_AUTH_DOMAIN --body "greed-and-gross-app.firebaseapp.com" 2>/dev/null && print_status "FIREBASE_AUTH_DOMAIN"
gh secret set FIREBASE_PROJECT_ID --body "greed-and-gross-app" 2>/dev/null && print_status "FIREBASE_PROJECT_ID"
gh secret set FIREBASE_STORAGE_BUCKET --body "greed-and-gross-app.appspot.com" 2>/dev/null && print_status "FIREBASE_STORAGE_BUCKET"
gh secret set FIREBASE_MESSAGING_SENDER_ID --body "123456789012" 2>/dev/null && print_status "FIREBASE_MESSAGING_SENDER_ID"
gh secret set FIREBASE_APP_ID --body "1:123456789012:web:abcdef1234567890" 2>/dev/null && print_status "FIREBASE_APP_ID"

echo ""

# OpenAI Secrets
print_info "Configurazione OpenAI secrets..."
gh secret set OPENAI_API_KEY --body "your_openai_api_key_here" 2>/dev/null && print_status "OPENAI_API_KEY"
gh secret set OPENAI_MODEL --body "gpt-4o-mini" 2>/dev/null && print_status "OPENAI_MODEL"

echo ""

# RevenueCat Secrets
print_info "Configurazione RevenueCat secrets..."
gh secret set REVENUECAT_API_KEY_IOS --body "appl_VxYzAbCdEfGhIjKlMnOpQrSt" 2>/dev/null && print_status "REVENUECAT_API_KEY_IOS"
gh secret set REVENUECAT_API_KEY_ANDROID --body "goog_UvWxYzAbCdEfGhIjKlMnOpQr" 2>/dev/null && print_status "REVENUECAT_API_KEY_ANDROID"

echo ""

# Android Keystore Secrets
print_info "Configurazione Android Keystore secrets..."
gh secret set ANDROID_KEYSTORE_PASSWORD --body "GreedGross2024!" 2>/dev/null && print_status "ANDROID_KEYSTORE_PASSWORD"
gh secret set ANDROID_KEY_ALIAS --body "greedgrosskey" 2>/dev/null && print_status "ANDROID_KEY_ALIAS"
gh secret set ANDROID_KEY_PASSWORD --body "GreedGross2024Key!" 2>/dev/null && print_status "ANDROID_KEY_PASSWORD"

echo ""

# API Endpoints Secrets
print_info "Configurazione API endpoints..."
gh secret set API_BASE_URL --body "https://greed-gross-api-production.herokuapp.com" 2>/dev/null && print_status "API_BASE_URL"
gh secret set WEBSOCKET_URL --body "wss://greed-gross-ws-production.herokuapp.com" 2>/dev/null && print_status "WEBSOCKET_URL"

echo ""

# Admin Secrets
print_info "Configurazione Admin secrets..."
gh secret set ADMIN_SECRET --body "greedandgross2024" 2>/dev/null && print_status "ADMIN_SECRET"
gh secret set ADMIN_BYPASS_CODE --body "tap7times" 2>/dev/null && print_status "ADMIN_BYPASS_CODE"

echo ""

# App Configuration Secrets
print_info "Configurazione App secrets..."
gh secret set APP_VERSION --body "1.0.0" 2>/dev/null && print_status "APP_VERSION"
gh secret set APP_BUILD_NUMBER --body "1" 2>/dev/null && print_status "APP_BUILD_NUMBER"
gh secret set ENVIRONMENT --body "production" 2>/dev/null && print_status "ENVIRONMENT"

echo ""
echo "========================================"
print_status "Setup automatico completato!"
echo ""

print_warning "Secrets da configurare MANUALMENTE:"
echo ""
echo "1. 🔐 FIREBASE_SERVICE_ACCOUNT"
echo "   • Vai su Firebase Console → Project Settings → Service Accounts"
echo "   • Clicca 'Generate new private key'"
echo "   • Copia tutto il contenuto JSON"
echo "   • gh secret set FIREBASE_SERVICE_ACCOUNT --body 'PASTE_JSON_HERE'"
echo ""

echo "2. 📱 ANDROID_KEYSTORE_BASE64"
echo "   • Genera keystore: scripts/generate-keystore.sh"
echo "   • Converti in Base64: base64 -i keystore.jks | pbcopy"
echo "   • gh secret set ANDROID_KEYSTORE_BASE64 --body 'PASTE_BASE64_HERE'"
echo ""

echo "3. 🚀 EXPO_TOKEN"
echo "   • npm install -g @expo/cli"
echo "   • expo login"
echo "   • expo whoami --json (copia il token)"
echo "   • gh secret set EXPO_TOKEN --body 'PASTE_TOKEN_HERE'"
echo ""

echo "4. 🍎 iOS Secrets (opzionali per App Store)"
echo "   • IOS_CERTIFICATE_BASE64"
echo "   • IOS_CERTIFICATE_PASSWORD"
echo "   • IOS_PROVISIONING_PROFILE_BASE64"
echo "   • APPLE_ID"
echo "   • APPLE_APP_SPECIFIC_PASSWORD"
echo ""

print_info "Per configurare i secrets manuali, leggi: .github/secrets-setup.md"
echo ""

# Verifica secrets configurati
print_info "Verifica secrets configurati..."
echo ""

REQUIRED_SECRETS=(
    "FIREBASE_API_KEY"
    "FIREBASE_PROJECT_ID"
    "OPENAI_API_KEY"
    "ANDROID_KEYSTORE_PASSWORD"
    "REVENUECAT_API_KEY_IOS"
    "REVENUECAT_API_KEY_ANDROID"
)

CONFIGURED=0
TOTAL=${#REQUIRED_SECRETS[@]}

for secret in "${REQUIRED_SECRETS[@]}"; do
    if gh secret list --json name | jq -r '.[].name' | grep -q "^$secret$" 2>/dev/null; then
        print_status "$secret configurato"
        ((CONFIGURED++))
    else
        print_error "$secret NON configurato"
    fi
done

echo ""
echo "📊 Secrets configurati: $CONFIGURED/$TOTAL"

if [ $CONFIGURED -eq $TOTAL ]; then
    print_status "Tutti i secrets richiesti sono configurati!"
    echo ""
    print_info "Prossimi passi:"
    echo "  1. Configura i secrets manuali (vedi sopra)"
    echo "  2. Fai push del codice per attivare GitHub Actions"
    echo "  3. Controlla il build su GitHub → Actions"
else
    print_warning "Alcuni secrets mancano. Controlla la configurazione."
fi

echo ""
echo "🎉 Setup GitHub Secrets completato!"
echo ""