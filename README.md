# 🌿 GREED & GROSS - Cannabis Breeding Simulator

Un simulatore professionale di breeding cannabis con AI integrata per breeder professionisti e hobbisti.

## 📱 Features

### 🧪 Laboratorio AI
- Chat con esperto genetista AI GREED & GROSS
- Simulazioni di incroci realistici
- Analisi dettagliate di terpeni e fenotipi
- Previsioni di resistenze e tempi di fioritura

### 🌍 Community Chat
- Chat globale tra breeder
- Condivisione strain e risultati
- Sistema di moderazione automatico
- Badge e livelli esperienza

### 📚 Strain Library
- Libreria personale strain illimitata (Premium)
- Filtri avanzati per tipo, terpeni, effetti
- Export PDF professionale
- Backup cloud automatico

### ⚙️ Sistema Abbonamento
- **Gratuito**: 1 incrocio/giorno, 5 messaggi, 10 strain
- **Premium**: Accesso illimitato a tutte le funzioni
- **Admin**: Pannello amministratore nascosto

## 🚀 Tecnologie

- **Frontend**: React Native + Expo + TypeScript
- **UI/UX**: NativeBase + React Native SVG
- **State Management**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation 6
- **Backend**: Node.js + Express + Firebase
- **AI**: OpenAI GPT-4o-mini
- **Database**: Firestore + AsyncStorage
- **Payments**: RevenueCat
- **Analytics**: Firebase Analytics

## 🛠️ Setup Sviluppo

### Prerequisiti
- Node.js 18+
- Expo CLI
- Firebase account
- OpenAI API key
- RevenueCat account

### Installazione
```bash
# Clone repository
git clone https://github.com/your-repo/greed-and-gross.git
cd greed-and-gross

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your API keys in .env
# Start development server
npm start
```

### Environment Variables
```env
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

# RevenueCat
REVENUECAT_API_KEY_IOS=your_ios_key
REVENUECAT_API_KEY_ANDROID=your_android_key

# Backend
API_BASE_URL=https://api.greedandgross.com
WEBSOCKET_URL=wss://ws.greedandgross.com
```

## 📱 Scripts Disponibili

```bash
# Development
npm start                 # Start Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS

# Quality & Testing
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
npm test                 # Run Jest tests
npm run test:e2e         # Run Detox E2E tests

# Build & Deploy
npm run build            # Build for production
npm run deploy:android   # Deploy to Play Store
npm run deploy:ios       # Deploy to App Store
```

## 🧪 AI Integration

### GREED & GROSS AI Prompt
L'AI è configurato come esperto genetista con conoscenza approfondita di:
- Genealogie strain esistenti
- Profili terpenici e flavonoidi
- Fenotipi e caratteristiche dominanti
- Resistenze e adattamenti ambientali
- Tempi di crescita e fioritura

### Caching System
- Cache intelligente su Firebase
- Hit rate ~75% per performance ottimali
- Analytics per strain più richiesti

## 🎨 Design System

### Color Palette
- **Primary**: #1B5E20 (Cannabis Green)
- **Secondary**: #FFD700 (Golden)
- **Accent**: #4CAF50 (Light Green)
- **Background**: #0D1117 (Dark Lab)
- **Text**: #E1E4E8 (Light Gray)

### Typography
- **Headings**: Orbitron (sci-fi)
- **Body**: Roboto (readable)
- **Monospace**: Roboto Mono

## 📊 Analytics & Tracking

### Firebase Events
- `app_open` - App launch
- `cross_request` - AI cross simulation
- `message_sent` - Community chat
- `subscription_start` - Premium upgrade
- `strain_saved` - Library addition

### Admin Dashboard
- User engagement metrics
- Popular strain analytics
- Revenue tracking
- System health monitoring

## 🔒 Security & Privacy

### Data Protection
- End-to-end encryption per chat
- Anonimizzazione dati utente
- Backup sicuri Firebase
- GDPR compliance

### Content Moderation
- Auto-moderation community chat
- Report system integrato
- Admin tools per moderazione

## 📱 Store Deployment

### App Store Optimization
- **Keywords**: cannabis breeding, genetics, simulator
- **Age Rating**: 17+ (substance reference)
- **Categories**: Education, Productivity

### Legal Compliance
- Disclaimer "Educational purposes only"
- Age verification 18+/21+
- Terms of service completi
- Privacy policy integrata

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Jest + React Native Testing Library
npm run test:coverage       # Coverage report
```

### E2E Tests
```bash
npm run test:e2e           # Detox automated testing
npm run test:e2e:build     # Build test app
```

### Performance Testing
- Bundle analyzer integrato
- Memory leak detection
- Startup time optimization

## 🚀 Deployment

### Production Build
```bash
# Build optimized bundle
expo build:android --type apk
expo build:ios --type archive

# Upload to stores
eas submit --platform android
eas submit --platform ios
```

### CI/CD Pipeline
- GitHub Actions automatici
- Test automation
- Store deployment automatico
- Performance monitoring

## 📞 Support

### User Support
- In-app help system
- Community forum
- Email support: support@greedandgross.com

### Developer Support
- Technical documentation
- API reference
- GitHub issues

## 📄 License

Educational use only. Cannabis breeding simulation for research and educational purposes.

## 🤝 Contributing

1. Fork il repository
2. Crea feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Apri Pull Request

---

**🌿 GREED & GROSS - Revolutionizing Cannabis Genetics Education**