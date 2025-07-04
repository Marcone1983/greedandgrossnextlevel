#!/bin/bash

echo "🔧 Fixing namespace issues for React Native modules..."

# Function to add namespace to a build.gradle file
add_namespace() {
    local BUILD_FILE="$1"
    local PACKAGE_NAME="$2"
    
    if [ -f "$BUILD_FILE" ]; then
        # Check if namespace already exists
        if ! grep -q "namespace" "$BUILD_FILE"; then
            echo "Adding namespace to: $BUILD_FILE"
            # Use a more robust approach to add namespace
            awk -v ns="$PACKAGE_NAME" '
                /android[[:space:]]*{/ {
                    print $0
                    if (getline > 0) {
                        print "    namespace \"" ns "\""
                        print $0
                    }
                    next
                }
                {print}
            ' "$BUILD_FILE" > "$BUILD_FILE.tmp" && mv "$BUILD_FILE.tmp" "$BUILD_FILE"
        fi
        
        # Also add buildConfig if needed
        if ! grep -q "buildFeatures" "$BUILD_FILE"; then
            echo "Adding buildFeatures.buildConfig to: $BUILD_FILE"
            # Find the android block and add buildFeatures inside it
            awk '/android {/{print; print "    buildFeatures {"; print "        buildConfig true"; print "    }"; next}1' "$BUILD_FILE" > "$BUILD_FILE.tmp" && mv "$BUILD_FILE.tmp" "$BUILD_FILE"
        fi
    fi
}

# Fix react-native-fs
add_namespace "node_modules/react-native-fs/android/build.gradle" "com.rnfs"

# Fix other common modules that might have issues
# react-native-device-info removed - not in package.json
add_namespace "node_modules/react-native-share/android/build.gradle" "cl.json"
add_namespace "node_modules/react-native-vector-icons/android/build.gradle" "com.oblador.vectoricons"
add_namespace "node_modules/react-native-webview/android/build.gradle" "com.reactnativecommunity.webview"
add_namespace "node_modules/react-native-linear-gradient/android/build.gradle" "com.BV.LinearGradient"
add_namespace "node_modules/react-native-haptic-feedback/android/build.gradle" "com.mkuczera"
add_namespace "node_modules/@react-native-async-storage/async-storage/android/build.gradle" "com.reactnativecommunity.asyncstorage"
add_namespace "node_modules/react-native-permissions/android/build.gradle" "com.zoontek.rnpermissions"
add_namespace "node_modules/react-native-safe-area-context/android/build.gradle" "com.th3rdwave.safeareacontext"
add_namespace "node_modules/react-native-screens/android/build.gradle" "com.swmansion.rnscreens"
add_namespace "node_modules/react-native-gesture-handler/android/build.gradle" "com.swmansion.gesturehandler"
add_namespace "node_modules/react-native-reanimated/android/build.gradle" "com.swmansion.reanimated"
add_namespace "node_modules/react-native-svg/android/build.gradle" "com.horcrux.svg"
add_namespace "node_modules/lottie-react-native/android/build.gradle" "com.airbnb.android.lottie"

# Find all build.gradle files in node_modules that might need namespace
echo "Searching for other modules that might need namespace..."
find node_modules -name "build.gradle" -path "*/android/*" -not -path "*/node_modules/*" 2>/dev/null | while read -r file; do
    # Extract module name
    MODULE_DIR=$(dirname "$file")
    MODULE_NAME=$(basename $(dirname "$MODULE_DIR"))
    
    # Check if it's an Android library module
    if grep -q "com.android.library" "$file" && ! grep -q "namespace" "$file"; then
        # Try to find package name from AndroidManifest.xml
        MANIFEST_FILE="$MODULE_DIR/src/main/AndroidManifest.xml"
        if [ -f "$MANIFEST_FILE" ]; then
            PACKAGE_NAME=$(grep -oP '(?<=package=")[^"]+' "$MANIFEST_FILE" 2>/dev/null || echo "")
            if [ -n "$PACKAGE_NAME" ]; then
                echo "Found module without namespace: $MODULE_NAME (package: $PACKAGE_NAME)"
                add_namespace "$file" "$PACKAGE_NAME"
            fi
        fi
    fi
done

echo "✅ Namespace fixing complete!"