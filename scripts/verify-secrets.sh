#!/bin/bash

# GREED & GROSS - GitHub Secrets Verification
# Verifica che tutti i secrets necessari siano configurati

set -e

echo "🔍 GREED & GROSS - Verifica GitHub Secrets"
echo "=========================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo "Installa GitHub CLI per verificare i secrets."
    exit 1
fi

# Verifica autenticazione
if ! gh auth status &> /dev/null; then
    print_error "Non sei autenticato con GitHub"
    echo "Esegui: gh auth login"
    exit 1
fi

print_info "Ottenimento lista secrets..."
echo ""

# Lista tutti i secrets configurati
CONFIGURED_SECRETS=$(gh secret list --json name | jq -r '.[].name' 2>/dev/null || echo "")

if [ -z "$CONFIGURED_SECRETS" ]; then
    print_error "Impossibile ottenere la lista dei secrets"
    echo "Controlla le tue autorizzazioni su GitHub"
    exit 1
fi

# Definisci i secrets richiesti per categoria

# Secrets ESSENZIALI (richiesti per il funzionamento base)
ESSENTIAL_SECRETS=(
    "FIREBASE_API_KEY"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_AUTH_DOMAIN"
    "OPENAI_API_KEY"
    "ANDROID_KEYSTORE_PASSWORD"
    "ANDROID_KEY_ALIAS"
    "ANDROID_KEY_PASSWORD"
)

# Secrets IMPORTANTI (richiesti per build completo)
IMPORTANT_SECRETS=(
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
    "FIREBASE_SERVICE_ACCOUNT"
    "ANDROID_KEYSTORE_BASE64"
    "REVENUECAT_API_KEY_IOS"
    "REVENUECAT_API_KEY_ANDROID"
)

# Secrets OPZIONALI (per funzionalità avanzate)
OPTIONAL_SECRETS=(
    "EXPO_TOKEN"
    "IOS_CERTIFICATE_BASE64"
    "IOS_CERTIFICATE_PASSWORD"
    "IOS_PROVISIONING_PROFILE_BASE64"
    "APPLE_ID"
    "APPLE_APP_SPECIFIC_PASSWORD"
    "API_BASE_URL"
    "WEBSOCKET_URL"
    "ADMIN_SECRET"
    "ADMIN_BYPASS_CODE"
)

# Funzione per verificare se un secret è configurato
check_secret() {
    local secret_name="$1"
    if echo "$CONFIGURED_SECRETS" | grep -q "^$secret_name$"; then
        return 0  # Trovato
    else
        return 1  # Non trovato
    fi
}

# Verifica secrets essenziali
echo "🔴 SECRETS ESSENZIALI (richiesti per funzionamento base):"
echo "========================================================"
ESSENTIAL_FOUND=0
ESSENTIAL_TOTAL=${#ESSENTIAL_SECRETS[@]}

for secret in "${ESSENTIAL_SECRETS[@]}"; do
    if check_secret "$secret"; then
        print_status "$secret"
        ((ESSENTIAL_FOUND++))
    else
        print_error "$secret - MANCANTE"
    fi
done

echo ""
echo "📊 Essenziali: $ESSENTIAL_FOUND/$ESSENTIAL_TOTAL"
echo ""

# Verifica secrets importanti
echo "🟡 SECRETS IMPORTANTI (richiesti per build completo):"
echo "====================================================="
IMPORTANT_FOUND=0
IMPORTANT_TOTAL=${#IMPORTANT_SECRETS[@]}

for secret in "${IMPORTANT_SECRETS[@]}"; do
    if check_secret "$secret"; then
        print_status "$secret"
        ((IMPORTANT_FOUND++))
    else
        print_warning "$secret - mancante"
    fi
done

echo ""
echo "📊 Importanti: $IMPORTANT_FOUND/$IMPORTANT_TOTAL"
echo ""

# Verifica secrets opzionali
echo "🟢 SECRETS OPZIONALI (per funzionalità avanzate):"
echo "================================================="
OPTIONAL_FOUND=0
OPTIONAL_TOTAL=${#OPTIONAL_SECRETS[@]}

for secret in "${OPTIONAL_SECRETS[@]}"; do
    if check_secret "$secret"; then
        print_status "$secret"
        ((OPTIONAL_FOUND++))
    else
        echo "⚪ $secret - non configurato"
    fi
done

echo ""
echo "📊 Opzionali: $OPTIONAL_FOUND/$OPTIONAL_TOTAL"
echo ""

# Calcola percentuale totale
TOTAL_FOUND=$((ESSENTIAL_FOUND + IMPORTANT_FOUND + OPTIONAL_FOUND))
TOTAL_SECRETS=$((ESSENTIAL_TOTAL + IMPORTANT_TOTAL + OPTIONAL_TOTAL))
PERCENTAGE=$((TOTAL_FOUND * 100 / TOTAL_SECRETS))

echo "=========================================="
echo "📈 RIEPILOGO CONFIGURAZIONE"
echo "=========================================="
echo "Secrets configurati: $TOTAL_FOUND/$TOTAL_SECRETS ($PERCENTAGE%)"
echo ""

# Valutazione stato
if [ $ESSENTIAL_FOUND -eq $ESSENTIAL_TOTAL ]; then
    if [ $IMPORTANT_FOUND -eq $IMPORTANT_TOTAL ]; then
        print_status "CONFIGURAZIONE COMPLETA!"
        echo "   ✅ Tutti i secrets essenziali e importanti sono configurati"
        echo "   🚀 L'app è pronta per il deployment automatico"
    else
        print_warning "CONFIGURAZIONE BUONA"
        echo "   ✅ Tutti i secrets essenziali sono configurati"
        echo "   ⚠️  Alcuni secrets importanti mancano"
        echo "   📱 L'app funziona ma il build automatico potrebbe fallire"
    fi
else
    print_error "CONFIGURAZIONE INCOMPLETA"
    echo "   ❌ Secrets essenziali mancanti!"
    echo "   🚫 L'app non funzionerà correttamente"
fi

echo ""

# Suggerimenti per secrets mancanti
if [ $ESSENTIAL_FOUND -lt $ESSENTIAL_TOTAL ] || [ $IMPORTANT_FOUND -lt $IMPORTANT_TOTAL ]; then
    echo "🔧 AZIONI RICHIESTE:"
    echo "==================="
    
    if [ $ESSENTIAL_FOUND -lt $ESSENTIAL_TOTAL ]; then
        echo ""
        print_error "Secrets essenziali mancanti:"
        for secret in "${ESSENTIAL_SECRETS[@]}"; do
            if ! check_secret "$secret"; then
                echo "   • $secret"
            fi
        done
        echo ""
        echo "   🏃‍♂️ Esegui: ./scripts/setup-github-secrets.sh"
    fi
    
    if [ $IMPORTANT_FOUND -lt $IMPORTANT_TOTAL ]; then
        echo ""
        print_warning "Secrets importanti mancanti:"
        for secret in "${IMPORTANT_SECRETS[@]}"; do
            if ! check_secret "$secret"; then
                echo "   • $secret"
                case $secret in
                    "FIREBASE_SERVICE_ACCOUNT")
                        echo "     → Vai su Firebase Console → Project Settings → Service Accounts"
                        ;;
                    "ANDROID_KEYSTORE_BASE64")
                        echo "     → Esegui: ./scripts/generate-keystore.sh"
                        ;;
                    "EXPO_TOKEN")
                        echo "     → Esegui: expo login && expo whoami --json"
                        ;;
                esac
            fi
        done
        echo ""
        echo "   📖 Leggi: .github/secrets-setup.md per le istruzioni dettagliate"
    fi
fi

echo ""

# Verifica secrets duplicati o non standard
echo "🔍 VERIFICA ANOMALIE:"
echo "===================="

# Lista secrets non riconosciuti
ALL_EXPECTED_SECRETS=("${ESSENTIAL_SECRETS[@]}" "${IMPORTANT_SECRETS[@]}" "${OPTIONAL_SECRETS[@]}")
UNKNOWN_SECRETS=()

while IFS= read -r secret; do
    if [[ -n "$secret" ]]; then
        FOUND=false
        for expected in "${ALL_EXPECTED_SECRETS[@]}"; do
            if [[ "$secret" == "$expected" ]]; then
                FOUND=true
                break
            fi
        done
        if [[ "$FOUND" == false ]]; then
            UNKNOWN_SECRETS+=("$secret")
        fi
    fi
done <<< "$CONFIGURED_SECRETS"

if [ ${#UNKNOWN_SECRETS[@]} -gt 0 ]; then
    print_warning "Secrets non riconosciuti trovati:"
    for secret in "${UNKNOWN_SECRETS[@]}"; do
        echo "   • $secret"
    done
    echo "   ⚠️  Potrebbero essere secrets obsoleti o configurati manualmente"
else
    print_status "Nessun secret anomalo trovato"
fi

echo ""

# Link utili
echo "📚 RISORSE UTILI:"
echo "================="
echo "• Setup automatico: ./scripts/setup-github-secrets.sh"
echo "• Documentazione: .github/secrets-setup.md"
echo "• Genera keystore: ./scripts/generate-keystore.sh"
echo "• GitHub Secrets: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/settings/secrets/actions"
echo ""

# Status finale
if [ $ESSENTIAL_FOUND -eq $ESSENTIAL_TOTAL ] && [ $IMPORTANT_FOUND -eq $IMPORTANT_TOTAL ]; then
    echo "🎉 Configurazione secrets completata con successo!"
    exit 0
elif [ $ESSENTIAL_FOUND -eq $ESSENTIAL_TOTAL ]; then
    echo "⚠️  Configurazione parziale - alcuni secrets importanti mancano"
    exit 1
else
    echo "❌ Configurazione incompleta - secrets essenziali mancanti"
    exit 2
fi