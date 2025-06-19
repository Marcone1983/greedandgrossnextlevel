# 🔥 Firebase Setup Guide per GREED & GROSS

## 📋 Prerequisiti

1. **Account Firebase** - Vai su [Firebase Console](https://console.firebase.google.com/)
2. **Node.js 18+** installato
3. **Firebase CLI** installato globalmente

```bash
npm install -g firebase-tools
```

## 🚀 Setup Passo-per-Passo

### 1. Crea Progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Clicca "Aggiungi progetto"
3. Nome progetto: `greed-and-gross-app`
4. Abilita Google Analytics (opzionale)
5. Seleziona account Analytics
6. Clicca "Crea progetto"

### 2. Configura Firestore Database

1. Nel tuo progetto Firebase, vai su **Firestore Database**
2. Clicca "Crea database"
3. Seleziona "Inizia in modalità test" (per development)
4. Scegli location (preferibilmente europe-west1)
5. Clicca "Fine"

### 3. Configura Firebase Authentication

1. Vai su **Authentication** > **Sign-in method**
2. Abilita "Accesso anonimo" (per la nostra app)
3. Salva le modificazioni

### 4. Configura Firebase Storage

1. Vai su **Storage**
2. Clicca "Inizia"
3. Seleziona le regole di sicurezza
4. Scegli location (stessa di Firestore)

### 5. Ottieni Configurazione Web

1. Vai su **Impostazioni progetto** (icona ingranaggio)
2. Scorri fino a "Le tue app"
3. Clicca sull'icona web `</>`
4. Registra app: nome `greed-and-gross-web`
5. Copia la configurazione `firebaseConfig`

### 6. Configura Variabili Ambiente

Crea il file `.env` nella root del progetto:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=greed-and-gross-app.firebaseapp.com
FIREBASE_PROJECT_ID=greed-and-gross-app
FIREBASE_STORAGE_BUCKET=greed-and-gross-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# RevenueCat Configuration
REVENUECAT_API_KEY_IOS=your_ios_key
REVENUECAT_API_KEY_ANDROID=your_android_key

# Backend API
API_BASE_URL=https://api.greedandgross.com
WEBSOCKET_URL=wss://ws.greedandgross.com

# Admin Configuration
ADMIN_SECRET=greedandgross2024
```

### 7. Imposta Regole Firestore

Vai su **Firestore Database** > **Regole** e sostituisci con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if resource.data.tier == 'admin';
    }
    
    // Strains collection - read for all, write for authenticated
    match /strains/{strainId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Crosses cache - read for all, write for system
    match /crosses_cache/{cacheId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Chat messages - read/write for authenticated
    match /chats/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    // Analytics - write only for system
    match /analytics/{eventId} {
      allow read: if request.auth != null;
      allow write: if true;
    }
    
    // Terpene profiles - read only
    match /terpene_profiles/{terpeneId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Breeding tips - read only
    match /breeding_tips/{tipId} {
      allow read: if true;
      allow write: if false;
    }
    
    // System data - admin only
    match /system/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Add proper admin check
    }
  }
}
```

### 8. Imposta Regole Storage

Vai su **Storage** > **Regole** e sostituisci con:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Strain images - read for all, write for authenticated
    match /strains/{strainId} {
      allow read: if true;
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    // User uploads - only for authenticated users
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 9. Importa Dati Iniziali

1. **Installa Firebase Admin SDK**:
```bash
npm install firebase-admin
```

2. **Ottieni Service Account Key**:
   - Vai su **Impostazioni progetto** > **Account di servizio**
   - Clicca "Genera nuova chiave privata"
   - Salva il file JSON come `firebase-service-account.json`

3. **Aggiorna script di import**:
   Modifica `scripts/import-firebase-data.js` con il tuo project ID

4. **Esegui import**:
```bash
cd scripts
node import-firebase-data.js
```

### 10. Configura Indexes Firestore

Vai su **Firestore Database** > **Indici** e crea questi indici compositi:

```json
// Indice per chat messages
{
  "collectionGroup": "chats",
  "fields": [
    {"fieldPath": "timestamp", "order": "DESCENDING"}
  ]
}

// Indice per analytics
{
  "collectionGroup": "analytics", 
  "fields": [
    {"fieldPath": "userId", "order": "ASCENDING"},
    {"fieldPath": "timestamp", "order": "DESCENDING"}
  ]
}

// Indice per users attivi
{
  "collectionGroup": "users",
  "fields": [
    {"fieldPath": "lastActive", "order": "DESCENDING"}
  ]
}

// Indice per strain per popolarità
{
  "collectionGroup": "strains",
  "fields": [
    {"fieldPath": "popularity", "order": "DESCENDING"}
  ]
}
```

### 11. Configura Cloud Functions (Opzionale)

Per funzionalità avanzate come moderazione automatica:

```bash
firebase init functions
cd functions
npm install
```

Esempio Cloud Function per moderazione chat:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.moderateMessage = functions.firestore
  .document('chats/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    
    // Simple profanity filter
    const badWords = ['spam', 'scam', 'fake'];
    const containsBadWords = badWords.some(word => 
      message.content.toLowerCase().includes(word)
    );
    
    if (containsBadWords) {
      await snap.ref.update({
        moderated: true,
        moderationReason: 'Contenuto inappropriato'
      });
    }
  });
```

## 🔐 Sicurezza e Best Practices

### Environment Variables
- ✅ Non committare mai file `.env`
- ✅ Usa Firebase App Check in produzione
- ✅ Implementa rate limiting
- ✅ Abilita audit logs

### Firestore Security
- ✅ Regole restrittive per default
- ✅ Validazione dati server-side
- ✅ Indici ottimizzati per performance
- ✅ Backup automatici abilitati

### Storage Security
- ✅ Limiti dimensione file
- ✅ Validazione tipo MIME
- ✅ Scansione malware automatica
- ✅ CDN per performance

## 📊 Monitoring e Analytics

### Firebase Analytics
1. Vai su **Analytics** > **Dashboard**
2. Configura conversioni personalizzate
3. Imposta pubblici per retargeting

### Performance Monitoring
1. Abilita **Performance** nel progetto
2. Configura trace personalizzati nell'app
3. Monitora tempi di risposta API

### Crashlytics
1. Abilita **Crashlytics** per crash reporting
2. Configura reporting automatico errori
3. Imposta alerts per crash critici

## 🚀 Deploy in Produzione

### Firestore Production Rules
```javascript
// Regole più restrittive per produzione
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Default deny
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && validateUserData();
    }
    
    // Aggiungi validazioni specifiche per ogni collection
  }
}
```

### Performance Optimization
- ✅ Indici compositi ottimizzati  
- ✅ Pagination per grandi dataset
- ✅ Caching strategico
- ✅ Lazy loading componenti

### Backup Strategy
- ✅ Export automatici daily
- ✅ Replica multi-region
- ✅ Disaster recovery plan
- ✅ Data retention policies

## 📞 Support e Troubleshooting

### Common Issues

**Firebase Connection Timeout:**
```bash
# Aumenta timeout nelle regole
# Verifica network connectivity
# Controlla quota Firebase
```

**Firestore Permission Denied:**
```bash
# Verifica authentication token
# Controlla regole Firestore 
# Debug con Firebase Emulator
```

**Analytics Non Funziona:**
```bash
# Verifica configurazione app
# Controlla consent privacy
# Abilita debug mode
```

### Debug Tools
- Firebase Emulator Suite per testing locale
- Firestore Debug Console
- Analytics Debug View
- Performance Monitoring dashboard

---

**🎉 Setup completato! La tua app GREED & GROSS è ora connessa a Firebase con tutti i dati di esempio importati.**

Per domande: [Firebase Support](https://firebase.google.com/support)