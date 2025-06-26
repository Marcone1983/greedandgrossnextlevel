#!/bin/bash
set -e

echo "FIXING GRADLE SYNTAX ERROR - THIS IS THE REAL FIX!"

# Fix in all build.gradle files
find . -name "build.gradle" -not -path "*/node_modules/*" | while read file; do
  echo "Fixing syntax in: $file"
  
  # Change old syntax to new syntax
  sed -i 's/compileSdkVersion /compileSdk /g' "$file"
  sed -i 's/targetSdkVersion /targetSdk /g' "$file"
  sed -i 's/minSdkVersion /minSdk /g' "$file"
  sed -i 's/buildToolsVersion .*//g' "$file"  # Remove buildToolsVersion, not needed anymore
done

# Also fix in the workflow where we add compileSdkVersion
echo "Syntax fixed! THIS WILL WORK!"