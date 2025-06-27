#!/bin/bash

echo "🔧 Fixing Gradle configuration issues for React Native modules..."

# Function to add publishing configuration to a build.gradle file
add_publishing_config() {
    local BUILD_FILE="$1"
    
    if [ -f "$BUILD_FILE" ]; then
        # Check if configurations already exists
        if ! grep -q "configurations {" "$BUILD_FILE"; then
            echo "Adding configurations to: $BUILD_FILE"
            # Add only configurations block
            echo "" >> "$BUILD_FILE"
            echo "configurations { default }" >> "$BUILD_FILE"
        fi
    fi
}

# Fix known problematic modules
MODULES=(
    "react-native-device-info"
    "react-native-firebase_app"
    "react-native-firebase_auth"
    "react-native-firebase_firestore"
    "react-native-firebase_storage"
    "react-native-firebase_analytics"
    "react-native-async-storage_async-storage"
    "react-native-share"
    "react-native-vector-icons"
    "react-native-webview"
    "react-native-linear-gradient"
    "react-native-haptic-feedback"
    "react-native-permissions"
    "react-native-safe-area-context"
    "react-native-screens"
    "react-native-gesture-handler"
    "react-native-reanimated"
    "react-native-svg"
    "lottie-react-native"
    # "react-native-fs" # Skipping react-native-fs as it has issues
)

for module in "${MODULES[@]}"; do
    # Handle @scoped packages
    MODULE_PATH=$(echo "$module" | sed 's/@//')
    BUILD_FILE="node_modules/$MODULE_PATH/android/build.gradle"
    add_publishing_config "$BUILD_FILE"
done

# Skip automatic search for now as it might break some modules
# Only fix the modules we explicitly listed above

echo "✅ Gradle configuration fixing complete!"