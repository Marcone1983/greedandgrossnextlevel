#!/bin/bash
set -e

echo "Fixing Java version compatibility issues..."

# Find all build.gradle files that might have Kotlin
find node_modules -name "build.gradle" | while read gradle_file; do
  # Check if it has kotlin
  if grep -q "kotlin" "$gradle_file" 2>/dev/null; then
    module_name=$(basename $(dirname $(dirname "$gradle_file")))
    echo "Fixing Java version for $module_name"
    
    # Add Java compatibility settings after android block
    if ! grep -q "sourceCompatibility" "$gradle_file"; then
      # First add compileOptions
      sed -i '/android {/a\    compileOptions {\
        sourceCompatibility JavaVersion.VERSION_17\
        targetCompatibility JavaVersion.VERSION_17\
    }' "$gradle_file"
      
      # Only add kotlinOptions if kotlin plugin is applied
      if grep -q "kotlin-android" "$gradle_file"; then
        sed -i '/compileOptions {/,/}/a\    kotlinOptions {\
        jvmTarget = "17"\
    }' "$gradle_file"
      fi
    fi
  fi
done

echo "Java version compatibility fixed!"