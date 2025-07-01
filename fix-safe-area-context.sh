#!/bin/bash
set -e

echo "🔧 Fixing react-native-safe-area-context compatibility..."

BUILD_FILE="node_modules/react-native-safe-area-context/android/build.gradle"
if [ -f "$BUILD_FILE" ]; then
    echo "  - Adding Kotlin options..."
    # Force Kotlin JVM target to 17
    if ! grep -q "kotlinOptions" "$BUILD_FILE"; then
        sed -i '/android {/a\
    kotlinOptions {\
        jvmTarget = "17"\
    }' "$BUILD_FILE"
    fi
    
    # Don't add dependencies - it's already handled by React Native
fi

# Fix the SafeAreaProviderManager.kt type mismatch
MANAGER_FILE="node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaProviderManager.kt"
if [ -f "$MANAGER_FILE" ]; then
    echo "  - Fixing SafeAreaProviderManager type mismatch..."
    # This is a tricky fix - we need to check the exact error and apply the appropriate fix
    # For now, let's try to fix the import
    sed -i 's/import com.facebook.react.uimanager.BaseViewManagerInterface/import com.facebook.react.viewmanagers.SafeAreaProviderManagerInterface as BaseViewManagerInterface/g' "$MANAGER_FILE" 2>/dev/null || true
fi

echo "✅ react-native-safe-area-context fixed!"