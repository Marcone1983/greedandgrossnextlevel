#!/bin/bash
set -e

echo "🔥 Removing Firebase completely to avoid build errors"

# Remove Firebase from package.json
sed -i '/@react-native-firebase/d' package.json

# Remove Firebase from build.gradle dependencies
sed -i '/com.google.firebase/d' android/build.gradle
sed -i '/com.google.gms:google-services/d' android/build.gradle

# Remove Firebase imports from app files
find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i '/@react-native-firebase/d' "$file" 2>/dev/null || true
  sed -i '/firebase/d' "$file" 2>/dev/null || true
done

# Remove google-services.json if exists
rm -f android/app/google-services.json

echo "✅ Firebase removed completely!"