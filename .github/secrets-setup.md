# 🔐 GitHub Secrets Setup per GREED & GROSS

## 📋 Lista Completa Secrets da Configurare

Vai su **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 🔥 Firebase Secrets

```bash
# Nome Secret: FIREBASE_API_KEY
# Valore: AIzaSyBvOyiDlEcFqTdDjMjp5K8L9nN2mR3oP4q

# Nome Secret: FIREBASE_AUTH_DOMAIN  
# Valore: greed-and-gross-app.firebaseapp.com

# Nome Secret: FIREBASE_PROJECT_ID
# Valore: greed-and-gross-app

# Nome Secret: FIREBASE_STORAGE_BUCKET
# Valore: greed-and-gross-app.appspot.com

# Nome Secret: FIREBASE_MESSAGING_SENDER_ID
# Valore: 123456789012

# Nome Secret: FIREBASE_APP_ID
# Valore: 1:123456789012:web:abcdef1234567890

# Nome Secret: FIREBASE_SERVICE_ACCOUNT
# Valore: [Copia tutto il contenuto JSON del service account]
```

### 🤖 OpenAI Secrets

```bash
# Nome Secret: OPENAI_API_KEY
# Valore: your_openai_api_key_here

# Nome Secret: OPENAI_MODEL
# Valore: gpt-4o-mini
```

### 💰 RevenueCat Secrets

```bash
# Nome Secret: REVENUECAT_API_KEY_IOS
# Valore: appl_VxYzAbCdEfGhIjKlMnOpQrSt

# Nome Secret: REVENUECAT_API_KEY_ANDROID  
# Valore: goog_UvWxYzAbCdEfGhIjKlMnOpQr
```

### 🔐 Android Keystore Secrets

```bash
# Nome Secret: ANDROID_KEYSTORE_PASSWORD
# Valore: GreedGross2024!

# Nome Secret: ANDROID_KEY_ALIAS
# Valore: greedgrosskey

# Nome Secret: ANDROID_KEY_PASSWORD
# Valore: GreedGross2024Key!

# Nome Secret: ANDROID_KEYSTORE_BASE64
# Valore: [Base64 del file keystore - vedi sotto come generarlo]
```

### 🍎 iOS Secrets (per deployment App Store)

```bash
# Nome Secret: IOS_CERTIFICATE_BASE64
# Valore: [Base64 del certificato P12]

# Nome Secret: IOS_CERTIFICATE_PASSWORD
# Valore: GreedGross2024iOS!

# Nome Secret: IOS_PROVISIONING_PROFILE_BASE64
# Valore: [Base64 del provisioning profile]

# Nome Secret: APPLE_ID
# Valore: your-apple-developer-id@example.com

# Nome Secret: APPLE_APP_SPECIFIC_PASSWORD
# Valore: xxxx-xxxx-xxxx-xxxx
```

### 🌐 API Endpoints Secrets

```bash
# Nome Secret: API_BASE_URL
# Valore: https://greed-gross-api-production.herokuapp.com

# Nome Secret: WEBSOCKET_URL
# Valore: wss://greed-gross-ws-production.herokuapp.com

# Nome Secret: ADMIN_SECRET
# Valore: greedandgross2024

# Nome Secret: ADMIN_BYPASS_CODE
# Valore: tap7times
```

### 📱 Expo Secrets

```bash
# Nome Secret: EXPO_TOKEN
# Valore: [Il tuo Expo access token]

# Nome Secret: EXPO_PROJECT_ID
# Valore: [Il tuo Expo project ID]
```

## 🔧 Come Generare i Secrets

### 1. Android Keystore

```bash
# Genera keystore
keytool -genkey -v -keystore greed-gross-release-key.keystore \
  -alias greedgrosskey -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass GreedGross2024! -keypass GreedGross2024Key! \
  -dname "CN=GREED & GROSS, OU=Development, O=GREED & GROSS, L=Rome, ST=Lazio, C=IT"

# Converti in Base64
base64 -i greed-gross-release-key.keystore | pbcopy
# Incolla il risultato come ANDROID_KEYSTORE_BASE64
```

### 2. Firebase Service Account

```bash
# 1. Vai su Firebase Console → Project Settings → Service Accounts
# 2. Clicca "Generate new private key"
# 3. Scarica il file JSON
# 4. Copia tutto il contenuto del JSON come FIREBASE_SERVICE_ACCOUNT
```

### 3. Expo Token

```bash
# 1. Installa Expo CLI: npm install -g @expo/cli
# 2. Login: expo login
# 3. Genera token: expo whoami --json
# 4. Copia il token
```

### 4. RevenueCat Keys

```bash
# 1. Vai su RevenueCat Dashboard → Apps
# 2. Seleziona la tua app iOS/Android
# 3. Vai su API Keys
# 4. Copia le chiavi pubbliche
```

## 📱 iOS Certificate Setup

### 1. Apple Developer Certificate

```bash
# 1. Vai su Apple Developer Portal
# 2. Certificates → Create new Distribution Certificate
# 3. Download e converti in P12:
openssl pkcs12 -export -out ios-certificate.p12 \
  -inkey private-key.pem -in certificate.crt \
  -password pass:GreedGross2024iOS!

# 4. Converti in Base64:
base64 -i ios-certificate.p12 | pbcopy
```

### 2. Provisioning Profile

```bash
# 1. Apple Developer Portal → Profiles
# 2. Create new Distribution Profile
# 3. Download il file .mobileprovision
# 4. Converti in Base64:
base64 -i profile.mobileprovision | pbcopy
```

## 🔄 Script Automatico per Setup

Creerò uno script per automatizzare il setup:

```bash
#!/bin/bash
# scripts/setup-github-secrets.sh

echo "🔐 GREED & GROSS - GitHub Secrets Setup"
echo ""

# Verifica che gh CLI sia installato
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI non trovato. Installa con: brew install gh"
    exit 1
fi

# Verifica autenticazione
if ! gh auth status &> /dev/null; then
    echo "🔑 Autenticati con GitHub:"
    gh auth login
fi

echo "📝 Configurazione secrets per repository..."

# Firebase Secrets
gh secret set FIREBASE_API_KEY --body "AIzaSyBvOyiDlEcFqTdDjMjp5K8L9nN2mR3oP4q"
gh secret set FIREBASE_AUTH_DOMAIN --body "greed-and-gross-app.firebaseapp.com"
gh secret set FIREBASE_PROJECT_ID --body "greed-and-gross-app"
gh secret set FIREBASE_STORAGE_BUCKET --body "greed-and-gross-app.appspot.com"
gh secret set FIREBASE_MESSAGING_SENDER_ID --body "123456789012"
gh secret set FIREBASE_APP_ID --body "1:123456789012:web:abcdef1234567890"

# OpenAI Secrets
gh secret set OPENAI_API_KEY --body "your_openai_api_key_here"
gh secret set OPENAI_MODEL --body "gpt-4o-mini"

# RevenueCat Secrets
gh secret set REVENUECAT_API_KEY_IOS --body "appl_VxYzAbCdEfGhIjKlMnOpQrSt"
gh secret set REVENUECAT_API_KEY_ANDROID --body "goog_UvWxYzAbCdEfGhIjKlMnOpQr"

# Android Keystore Secrets
gh secret set ANDROID_KEYSTORE_PASSWORD --body "GreedGross2024!"
gh secret set ANDROID_KEY_ALIAS --body "greedgrosskey"
gh secret set ANDROID_KEY_PASSWORD --body "GreedGross2024Key!"

# API Secrets
gh secret set API_BASE_URL --body "https://greed-gross-api-production.herokuapp.com"
gh secret set WEBSOCKET_URL --body "wss://greed-gross-ws-production.herokuapp.com"
gh secret set ADMIN_SECRET --body "greedandgross2024"
gh secret set ADMIN_BYPASS_CODE --body "tap7times"

echo ""
echo "✅ Secrets di base configurati!"
echo ""
echo "⚠️  Secrets da configurare manualmente:"
echo "   • FIREBASE_SERVICE_ACCOUNT (JSON del service account)"
echo "   • ANDROID_KEYSTORE_BASE64 (Base64 del keystore)"
echo "   • EXPO_TOKEN (Token di accesso Expo)"
echo "   • IOS_CERTIFICATE_BASE64 (Certificato iOS P12)"
echo "   • IOS_PROVISIONING_PROFILE_BASE64 (Provisioning profile)"
echo ""
echo "📖 Leggi scripts/secrets-setup.md per le istruzioni complete"
```

## 🚀 Verifica Secrets

Usa questo script per verificare che tutti i secrets siano configurati:

```bash
#!/bin/bash
# scripts/verify-secrets.sh

echo "🔍 Verifica GitHub Secrets..."

SECRETS=(
  "FIREBASE_API_KEY"
  "FIREBASE_PROJECT_ID"
  "OPENAI_API_KEY"
  "ANDROID_KEYSTORE_PASSWORD"
  "REVENUECAT_API_KEY_IOS"
)

for secret in "${SECRETS[@]}"; do
  if gh secret list | grep -q "$secret"; then
    echo "✅ $secret configurato"
  else
    echo "❌ $secret mancante"
  fi
done
```

## 📚 Environment Variables vs Secrets

### GitHub Secrets (Sensibili)
- ✅ API Keys (Firebase, OpenAI, RevenueCat)
- ✅ Passwords e certificati
- ✅ Service Account JSON
- ✅ Keystore e signing credentials

### Environment Variables (Pubbliche)
- ✅ URLs pubblici
- ✅ Configurazioni app
- ✅ Feature flags
- ✅ Versioni e build numbers

---

**🎉 Setup completo! Il tuo repository è ora configurato per CI/CD automatico con tutti i secrets necessari.**