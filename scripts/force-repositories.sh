#!/bin/bash
set -e

echo "Forcing repositories for all React Native modules..."

# Find all build.gradle files in node_modules
find node_modules -name "build.gradle" | while read gradle_file; do
  # Skip react-native itself
  if [[ "$gradle_file" == *"node_modules/react-native/"* ]]; then
    continue
  fi
  
  # Check if it mentions com.facebook.react
  if grep -q "com.facebook.react" "$gradle_file" 2>/dev/null; then
    module_name=$(basename $(dirname $(dirname "$gradle_file")))
    echo "Fixing $module_name"
    
    # Force add our repository at the beginning of repositories block
    # First, for regular repositories blocks
    sed -i '/repositories {/{
      a\        maven { url file("$rootDir/../local-maven") }
    }' "$gradle_file"
    
    # Also handle buildscript repositories
    sed -i '/buildscript {/,/}/ {
      /repositories {/{
        a\        maven { url file("$rootDir/../local-maven") }
      }
    }' "$gradle_file"
  fi
done

echo "Repositories forced!"