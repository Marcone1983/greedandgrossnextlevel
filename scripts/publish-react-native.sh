#!/bin/bash
set -e

echo "Publishing React Native to local Maven repository..."

# Create local Maven repository
LOCAL_REPO="$PWD/local-maven-repo"
mkdir -p "$LOCAL_REPO"

# Find React Native AAR in node_modules
RN_AAR=""
if [ -f "node_modules/react-native/android/com/facebook/react/react-native/0.79.0/react-native-0.79.0.aar" ]; then
  RN_AAR="node_modules/react-native/android/com/facebook/react/react-native/0.79.0/react-native-0.79.0.aar"
elif [ -f "node_modules/react-native/android/com/facebook/react/react-android/0.79.0/react-android-0.79.0.aar" ]; then
  RN_AAR="node_modules/react-native/android/com/facebook/react/react-android/0.79.0/react-android-0.79.0.aar"
fi

# If no AAR found, check if we can use the React Native Android build
if [ -z "$RN_AAR" ]; then
  echo "React Native AAR not found in expected locations"
  echo "Using node_modules/react-native/android as Maven repository"
  
  # Add the repository to all module build.gradle files
  find node_modules -name "build.gradle" -not -path "*/react-native/*" | while read gradle_file; do
    if grep -q "com.facebook.react:react-native" "$gradle_file" 2>/dev/null; then
      module_name=$(basename $(dirname $(dirname "$gradle_file")))
      echo "Adding repository to $module_name"
      
      # Add the repository at the beginning of repositories block
      sed -i '/repositories {/a\        maven { url("$rootDir/node_modules/react-native/android") }' "$gradle_file"
    fi
  done
else
  echo "Found React Native AAR at: $RN_AAR"
  # Copy to local repository
  mkdir -p "$LOCAL_REPO/com/facebook/react/react-native/0.79.0"
  cp "$RN_AAR" "$LOCAL_REPO/com/facebook/react/react-native/0.79.0/"
  
  # Also copy POM if it exists
  RN_POM="${RN_AAR%.aar}.pom"
  if [ -f "$RN_POM" ]; then
    cp "$RN_POM" "$LOCAL_REPO/com/facebook/react/react-native/0.79.0/"
  fi
fi

echo "React Native publishing completed!"