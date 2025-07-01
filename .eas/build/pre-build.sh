#!/bin/bash
set -e

echo "🔧 Running pre-build fixes..."

# Fix Firebase modules for Gradle 8.8 compatibility
echo "🔥 Fixing Firebase modules..."
for module in app auth firestore storage analytics; do
    BUILD_FILE="node_modules/@react-native-firebase/$module/android/build.gradle"
    if [ -f "$BUILD_FILE" ]; then
        echo "  - Fixing @react-native-firebase/$module"
        # Comment out the problematic afterEvaluate { publishing { ... } } block
        sed -i '/afterEvaluate {/,/^}/s/^/\/\/ /' "$BUILD_FILE" || true
    fi
done

# Fix react-native-reanimated for React Native 0.79.0
echo "🎬 Fixing react-native-reanimated..."
REANIMATED_BUILD="node_modules/react-native-reanimated/android/build.gradle"
if [ -f "$REANIMATED_BUILD" ]; then
    # Force Hermes detection to true
    sed -i '165s/if (appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean())/if (true)/' "$REANIMATED_BUILD" || true
    # Force C++17 instead of C++20
    sed -i 's/-std=c++20/-std=c++17/g' "$REANIMATED_BUILD" || true
fi

# Fix CMakeLists for C++17
find node_modules/react-native-reanimated -name "CMakeLists.txt" -exec sed -i 's/CMAKE_CXX_STANDARD 20/CMAKE_CXX_STANDARD 17/g' {} \; || true

# Ensure namespace for all React Native modules
echo "📦 Ensuring namespaces for all modules..."
for dir in node_modules/react-native-*/android node_modules/@react-native-*/android node_modules/@react-native-firebase/*/android; do
    if [ -d "$dir" ]; then
        BUILD_GRADLE="$dir/build.gradle"
        if [ -f "$BUILD_GRADLE" ]; then
            # Check if namespace is missing
            if ! grep -q "namespace" "$BUILD_GRADLE"; then
                MANIFEST="$dir/src/main/AndroidManifest.xml"
                if [ -f "$MANIFEST" ]; then
                    # Extract package name from manifest
                    PACKAGE=$(grep -o 'package="[^"]*"' "$MANIFEST" | sed 's/package="//;s/"//')
                    if [ -n "$PACKAGE" ]; then
                        echo "  - Adding namespace $PACKAGE to $dir"
                        # Add namespace after android {
                        sed -i "/android {/a\\    namespace \"$PACKAGE\"" "$BUILD_GRADLE" || true
                    fi
                fi
            fi
        fi
    fi
done

echo "✅ Pre-build fixes completed!"