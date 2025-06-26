#!/bin/bash
set -e

echo "🔧 Fixing bcprov-jdk18on jar issue based on web search solutions..."

# Solution 1: Clear ALL gradle caches (most effective)
echo "Clearing ALL gradle caches completely..."
rm -rf ~/.gradle/caches/

# Solution 2: Clear specific Android directories
echo "Clearing Android build directories..."
cd GreedGross
./gradlew clean || true
cd ..

# Solution 3: Update react-native-gesture-handler to 2.9.0
echo "Updating react-native-gesture-handler to 2.9.0..."
npm install react-native-gesture-handler@^2.9.0 --legacy-peer-deps

echo "✅ bcprov issue fixes applied!"