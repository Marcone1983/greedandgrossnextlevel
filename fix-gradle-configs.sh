#!/bin/bash

echo "🔧 Fixing Gradle configuration issues for React Native modules..."

# Function to add publishing configuration to a build.gradle file
add_publishing_config() {
    local BUILD_FILE="$1"
    
    if [ -f "$BUILD_FILE" ]; then
        # Check if publishing configuration already exists
        if ! grep -q "publishing {" "$BUILD_FILE"; then
            echo "Adding publishing configuration to: $BUILD_FILE"
            # Add publishing configuration at the end of the file
            cat >> "$BUILD_FILE" << 'EOF'

// Added to fix Gradle 8.8 compatibility
publishing {
    publications {
        release(MavenPublication) {
            from components.release
        }
    }
}

configurations {
    default
}

artifacts {
    default file("${project.buildDir}/outputs/aar/${project.name}-release.aar")
}
EOF
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
    "react-native-fs"
)

for module in "${MODULES[@]}"; do
    # Handle @scoped packages
    MODULE_PATH=$(echo "$module" | sed 's/@//')
    BUILD_FILE="node_modules/$MODULE_PATH/android/build.gradle"
    add_publishing_config "$BUILD_FILE"
done

# Find all other React Native modules that might need this fix
echo "Searching for other modules that might need configuration fix..."
find node_modules -name "build.gradle" -path "*/android/*" -not -path "*/node_modules/*" 2>/dev/null | while read -r file; do
    # Check if it's an Android library module
    if grep -q "com.android.library" "$file"; then
        # Check if it already has publishing configuration
        if ! grep -q "publishing {" "$file" && ! grep -q "configurations {" "$file"; then
            MODULE_DIR=$(dirname "$file")
            MODULE_NAME=$(basename $(dirname "$MODULE_DIR"))
            echo "Found module without publishing config: $MODULE_NAME"
            add_publishing_config "$file"
        fi
    fi
done

echo "✅ Gradle configuration fixing complete!"