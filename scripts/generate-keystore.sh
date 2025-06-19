#!/bin/bash

# GREED & GROSS - Android Keystore Generator
# Genera il keystore per firmare l'APK di produzione

set -e

echo "🔐 GREED & GROSS - Android Keystore Generator"
echo "=============================================="
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

# Verifica che keytool sia disponibile
if ! command -v keytool &> /dev/null; then
    print_error "keytool non trovato!"
    echo ""
    echo "keytool è incluso nel JDK. Installa OpenJDK:"
    echo "  macOS: brew install openjdk"
    echo "  Ubuntu: sudo apt install openjdk-11-jdk"
    echo "  Windows: Download da Oracle JDK"
    echo ""
    exit 1
fi

# Parametri keystore
KEYSTORE_NAME="greed-gross-release-key.keystore"
KEY_ALIAS="greedgrosskey"
KEYSTORE_PASSWORD="GreedGross2024!"
KEY_PASSWORD="GreedGross2024Key!"
VALIDITY_DAYS=10000

# Info azienda
COMPANY_NAME="GREED & GROSS"
ORGANIZATIONAL_UNIT="Mobile Development"
ORGANIZATION="GREED & GROSS Labs"
CITY="Rome"
STATE="Lazio"
COUNTRY="IT"

# Directory destinazione
ANDROID_DIR="android/app"
KEYSTORE_PATH="$ANDROID_DIR/$KEYSTORE_NAME"

print_info "Configurazione keystore:"
echo "  Nome file: $KEYSTORE_NAME"
echo "  Alias chiave: $KEY_ALIAS"
echo "  Password keystore: $KEYSTORE_PASSWORD"
echo "  Password chiave: $KEY_PASSWORD"
echo "  Validità: $VALIDITY_DAYS giorni (~27 anni)"
echo ""

print_info "Informazioni certificato:"
echo "  Azienda: $COMPANY_NAME"
echo "  Unità organizzativa: $ORGANIZATIONAL_UNIT"
echo "  Organizzazione: $ORGANIZATION"
echo "  Città: $CITY"
echo "  Stato/Provincia: $STATE"
echo "  Paese: $COUNTRY"
echo ""

# Crea directory se non esiste
mkdir -p "$ANDROID_DIR"

# Controlla se keystore esiste già
if [ -f "$KEYSTORE_PATH" ]; then
    print_warning "Keystore esistente trovato: $KEYSTORE_PATH"
    echo ""
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operazione annullata."
        exit 0
    fi
    rm -f "$KEYSTORE_PATH"
fi

print_info "Generazione keystore in corso..."
echo ""

# Genera keystore
keytool -genkey -v -keystore "$KEYSTORE_PATH" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $VALIDITY_DAYS \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$COMPANY_NAME, OU=$ORGANIZATIONAL_UNIT, O=$ORGANIZATION, L=$CITY, ST=$STATE, C=$COUNTRY"

print_status "Keystore generato con successo!"
echo ""

# Verifica keystore
print_info "Verifica keystore..."
keytool -list -v -keystore "$KEYSTORE_PATH" -storepass "$KEYSTORE_PASSWORD"

echo ""
print_status "Keystore verificato!"
echo ""

# Genera Base64 per GitHub Secrets
print_info "Generazione Base64 per GitHub Secrets..."
if command -v base64 &> /dev/null; then
    BASE64_KEYSTORE=$(base64 -i "$KEYSTORE_PATH" | tr -d '\n')
    echo ""
    print_status "Base64 generato!"
    echo ""
    print_warning "IMPORTANTE: Salva questo Base64 come GitHub Secret ANDROID_KEYSTORE_BASE64:"
    echo ""
    echo "========================================================================"
    echo "$BASE64_KEYSTORE"
    echo "========================================================================"
    echo ""
    
    # Salva Base64 in file temporaneo
    echo "$BASE64_KEYSTORE" > "$ANDROID_DIR/keystore-base64.txt"
    print_info "Base64 salvato anche in: $ANDROID_DIR/keystore-base64.txt"
    
    # Copia in clipboard se possibile
    if command -v pbcopy &> /dev/null; then
        echo "$BASE64_KEYSTORE" | pbcopy
        print_status "Base64 copiato nella clipboard (macOS)!"
    elif command -v xclip &> /dev/null; then
        echo "$BASE64_KEYSTORE" | xclip -selection clipboard
        print_status "Base64 copiato nella clipboard (Linux)!"
    fi
else
    print_warning "Comando base64 non trovato. Genera manualmente:"
    echo "base64 -i $KEYSTORE_PATH | tr -d '\\n'"
fi

echo ""

# Aggiorna gradle.properties se esiste
GRADLE_PROPERTIES="android/gradle.properties"
if [ -f "$GRADLE_PROPERTIES" ]; then
    print_info "Aggiornamento gradle.properties..."
    
    # Backup
    cp "$GRADLE_PROPERTIES" "$GRADLE_PROPERTIES.backup"
    
    # Aggiorna le proprietà
    sed -i.bak "s|GREED_GROSS_UPLOAD_STORE_FILE=.*|GREED_GROSS_UPLOAD_STORE_FILE=$KEYSTORE_NAME|g" "$GRADLE_PROPERTIES"
    sed -i.bak "s|GREED_GROSS_UPLOAD_STORE_PASSWORD=.*|GREED_GROSS_UPLOAD_STORE_PASSWORD=$KEYSTORE_PASSWORD|g" "$GRADLE_PROPERTIES"
    sed -i.bak "s|GREED_GROSS_UPLOAD_KEY_ALIAS=.*|GREED_GROSS_UPLOAD_KEY_ALIAS=$KEY_ALIAS|g" "$GRADLE_PROPERTIES"
    sed -i.bak "s|GREED_GROSS_UPLOAD_KEY_PASSWORD=.*|GREED_GROSS_UPLOAD_KEY_PASSWORD=$KEY_PASSWORD|g" "$GRADLE_PROPERTIES"
    
    # Rimuovi file backup
    rm -f "$GRADLE_PROPERTIES.bak"
    
    print_status "gradle.properties aggiornato!"
fi

echo ""
print_info "Configurazione GitHub Secrets:"
echo ""
echo "Esegui questi comandi per configurare i secrets:"
echo ""
echo "gh secret set ANDROID_KEYSTORE_PASSWORD --body '$KEYSTORE_PASSWORD'"
echo "gh secret set ANDROID_KEY_ALIAS --body '$KEY_ALIAS'"
echo "gh secret set ANDROID_KEY_PASSWORD --body '$KEY_PASSWORD'"
echo "gh secret set ANDROID_KEYSTORE_BASE64 --body 'PASTE_BASE64_FROM_ABOVE'"
echo ""

print_warning "IMPORTANTE - Sicurezza:"
echo "1. 🔐 NON committare mai il file keystore nel repository!"
echo "2. 🔐 Fai backup sicuro del keystore in un luogo sicuro"
echo "3. 🔐 Senza questo keystore non potrai aggiornare l'app su Play Store"
echo "4. 🔐 Il file keystore-base64.txt contiene dati sensibili - eliminalo dopo l'uso"
echo ""

# Aggiungi al .gitignore se esiste
if [ -f ".gitignore" ]; then
    if ! grep -q "*.keystore" .gitignore; then
        echo "" >> .gitignore
        echo "# Android Keystore" >> .gitignore
        echo "*.keystore" >> .gitignore
        echo "keystore-base64.txt" >> .gitignore
        print_status ".gitignore aggiornato per escludere keystore"
    fi
fi

echo ""
print_status "Keystore Android configurato con successo!"
echo ""
print_info "Prossimi passi:"
echo "1. Configura i GitHub Secrets con i valori sopra"
echo "2. Fai backup sicuro del keystore"
echo "3. Elimina il file keystore-base64.txt"
echo "4. Testa il build di release"
echo ""

# Suggerisci comando per testare build
print_info "Per testare il build di release:"
echo "cd android && ./gradlew assembleRelease"
echo ""