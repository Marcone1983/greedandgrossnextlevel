#!/bin/bash
set -e

echo "Forcing repositories in all React Native modules..."

# List of problematic modules
modules=(
  "@react-native-async-storage/async-storage"
  "@react-native-firebase/app"
  "@react-native-firebase/analytics"
  "@react-native-firebase/firestore"
  "@react-native-firebase/storage"
  "lottie-react-native"
  "react-native-reanimated"
  "react-native-svg"
  "react-native-screens"
  "react-native-safe-area-context"
  "react-native-gesture-handler"
)

for module in "${modules[@]}"; do
  gradle_file="node_modules/$module/android/build.gradle"
  if [ -f "$gradle_file" ]; then
    echo "Fixing $module"
    
    # Add repository at the very beginning of repositories block
    # This ensures our repository is checked first
    sed -i '/repositories {/a\        maven { url file("$rootDir/../node_modules/react-native/android") }' "$gradle_file"
  fi
done

echo "Repositories forced in all modules!"