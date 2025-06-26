#!/bin/bash
set -e

echo "Fixing missing SDK versions..."

# Find all build.gradle files
find node_modules -name "build.gradle" | while read gradle_file; do
  # Check if it has android block but no compileSdkVersion
  if grep -q "android {" "$gradle_file" && ! grep -q "compileSdkVersion" "$gradle_file"; then
    module_name=$(basename $(dirname $(dirname "$gradle_file")))
    echo "Fixing SDK version for $module_name"
    
    # Add compileSdkVersion after android block
    sed -i '/android {/a\    compileSdkVersion 34' "$gradle_file"
  fi
done

echo "SDK versions fixed!"