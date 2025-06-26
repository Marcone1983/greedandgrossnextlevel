#!/bin/bash

# Script per fixare il build quando il workflow cambia a 0.80.0

echo "Fixing React Native version issue..."

# Se package.json contiene 0.80.0, npm install installerà comunque 0.79.0
# perché 0.80.0 non esiste su npm

# Dopo npm install, dobbiamo creare i file Maven che i moduli cercano
cd node_modules/react-native/android/com/facebook/react

# Crea copie 0.80.0 da 0.79.0 per ogni artifact
for artifact in react-native react-android hermes-android react-native-gradle-plugin; do
  if [ -d "$artifact/0.79.0" ] && [ ! -d "$artifact/0.80.0" ]; then
    echo "Creating $artifact 0.80.0..."
    cp -r "$artifact/0.79.0" "$artifact/0.80.0"
    
    # Rinomina i file per riflettere 0.80.0
    find "$artifact/0.80.0" -name "*0.79.0*" -type f | while read file; do
      newfile=$(echo "$file" | sed 's/0.79.0/0.80.0/g')
      mv "$file" "$newfile"
      
      # Aggiorna il contenuto dei file POM
      if [[ "$newfile" == *.pom ]]; then
        sed -i 's/0\.79\.0/0.80.0/g' "$newfile"
      fi
    done
  fi
done

echo "Fix completed"