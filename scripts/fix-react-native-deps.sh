#!/bin/bash
set -e

echo "Fixing React Native dependencies..."

# Find all modules that depend on com.facebook.react
find ../node_modules -name "build.gradle" -not -path "*/react-native/*" | while read gradle_file; do
  module_name=$(basename $(dirname $(dirname "$gradle_file")))
  
  # Check if it has com.facebook.react dependency
  if grep -q "com.facebook.react:react-native" "$gradle_file" 2>/dev/null; then
    echo "Fixing $module_name..."
    
    # Replace com.facebook.react:react-native with project dependency
    sed -i 's/implementation.*com\.facebook\.react:react-native.*/implementation project(":ReactAndroid")/' "$gradle_file"
    sed -i 's/api.*com\.facebook\.react:react-native.*/api project(":ReactAndroid")/' "$gradle_file"
    sed -i 's/compileOnly.*com\.facebook\.react:react-native.*/compileOnly project(":ReactAndroid")/' "$gradle_file"
    
    # Do the same for react-android and hermes-android
    sed -i 's/implementation.*com\.facebook\.react:react-android.*/implementation project(":ReactAndroid")/' "$gradle_file"
    sed -i 's/implementation.*com\.facebook\.react:hermes-android.*/implementation project(":ReactAndroid:hermes-engine")/' "$gradle_file"
  fi
done

# Add ReactAndroid to settings.gradle if not already there
if ! grep -q "include ':ReactAndroid'" ../GreedGross/settings.gradle; then
  echo "" >> ../GreedGross/settings.gradle
  echo "// React Native modules" >> ../GreedGross/settings.gradle
  echo "include ':ReactAndroid'" >> ../GreedGross/settings.gradle
  echo "project(':ReactAndroid').projectDir = new File(rootProject.projectDir, '../node_modules/react-native/ReactAndroid')" >> ../GreedGross/settings.gradle
fi

echo "Dependencies fixed!"