#!/bin/bash

echo "Preparing build environment for React Native 0.80.0..."

# Esegui tutti gli script di fix
echo "Running postinstall scripts..."
npm run postinstall || true

# Esegui il fix specifico per i problemi del workflow
echo "Running workflow version fixes..."
node scripts/fix-workflow-version-issues.js

# Pulisci la cache di gradle se esiste
if [ -d "GreedGross" ]; then
  echo "Cleaning gradle cache..."
  cd GreedGross
  ./gradlew clean || true
  cd ..
elif [ -d "android" ]; then
  echo "Cleaning gradle cache..."
  cd android
  ./gradlew clean || true
  cd ..
fi

echo "Build preparation complete!"