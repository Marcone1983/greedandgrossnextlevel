#!/bin/bash
set -e

echo "Fixing React Native version mismatch..."

cd node_modules/react-native/android/com/facebook/react

# Create 0.79.0 directories and link to 0.80.0 files
for module in react-native react-android hermes-android; do
  if [ -d "$module/0.80.0" ] && [ ! -d "$module/0.79.0" ]; then
    echo "Creating 0.79.0 version for $module"
    mkdir -p "$module/0.79.0"
    
    # Copy files from 0.80.0 to 0.79.0
    for file in "$module/0.80.0"/*; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        newname="${filename/0.80.0/0.79.0}"
        cp "$file" "$module/0.79.0/$newname"
        
        # Also update version in POM files
        if [[ "$newname" == *.pom ]]; then
          sed -i 's/0.80.0/0.79.0/g' "$module/0.79.0/$newname"
        fi
      fi
    done
  fi
done

echo "Version mismatch fixed!"