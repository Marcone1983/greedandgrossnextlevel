# Fix per il Problema delle Versioni nel Workflow

## Il Problema

Il workflow `NonToccare.yml` esegue questo comando:
```bash
sed -i 's/0\.79\.0/0.80.0/g' package.json
```

Questo cambia TUTTE le occorrenze di `0.79.0` in `0.80.0` nel package.json, ma:
1. **React Native 0.80.0 non esiste** - l'ultima versione è 0.79.0
2. Lottie-react-native e altri moduli cercano specificamente i file Maven per la versione dichiarata
3. I file Maven in `node_modules/react-native/android` esistono solo per 0.79.0

## La Soluzione

Ho creato degli script che:

1. **`scripts/fix-maven-0.80.0.js`** - Crea i file Maven mancanti per 0.80.0 copiandoli da 0.79.0
2. **`scripts/fix-workflow-version-issues.js`** - Fix completo che:
   - Crea tutti i Maven artifacts necessari
   - Corregge il problema C++ standard in react-native-reanimated
   - Sistema i file nel gradle-plugin
3. **`scripts/prepare-build-0.80.0.sh`** - Script bash che il workflow può eseguire

## Come Usare

### Nel Workflow

Dopo la sezione "Fix React Native version", aggiungi:
```yaml
- name: Fix version compatibility issues
  run: |
    chmod +x scripts/prepare-build-0.80.0.sh
    ./scripts/prepare-build-0.80.0.sh
```

### Localmente

Se hai già eseguito npm install e hai problemi:
```bash
node scripts/fix-workflow-version-issues.js
```

## Dettagli Tecnici

Il problema principale è che quando Gradle cerca di risolvere le dipendenze, cerca i file in questi percorsi:
- `node_modules/react-native/android/com/facebook/react/react-native/0.80.0/`
- `node_modules/@react-native/gradle-plugin/build/com/facebook/react/react-native-gradle-plugin/0.80.0/`

Ma questi file non esistono perché React Native 0.80.0 non è mai stata rilasciata.

Gli script creano questi file copiando quelli di 0.79.0 e modificando i metadata per far credere a Gradle che 0.80.0 esista.

## Note Importanti

- Questa è una soluzione temporanea per far funzionare il workflow esistente
- La soluzione ideale sarebbe NON cambiare la versione nel package.json
- Se il workflow venisse modificato per non fare il sed, questi fix non sarebbero necessari