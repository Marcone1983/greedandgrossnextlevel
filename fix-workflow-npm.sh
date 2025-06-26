#!/bin/bash

# Dopo che il workflow cambia a 0.80.0, dobbiamo fixare package.json
# perché React Native 0.80.0 NON ESISTE

echo "Fixing package.json for non-existent React Native version..."

# Ripristina 0.79.0 in package.json
sed -i 's/0\.80\.0/0.79.0/g' package.json

# Reinstalla con la versione corretta
echo "Reinstalling with correct version..."
npm install

echo "Fix completed"