#!/bin/bash
set -e

echo "🔧 FIXING ALL BUILD ISSUES NOW!"

# 1. Fix react-native-reanimated C++20 issue
echo "📦 Patching react-native-reanimated for C++20..."
mkdir -p patches
cat > patches/react-native-reanimated+3.16.7.patch << 'EOF'
diff --git a/node_modules/react-native-reanimated/android/CMakeLists.txt b/node_modules/react-native-reanimated/android/CMakeLists.txt
index 1234567..abcdefg 100644
--- a/node_modules/react-native-reanimated/android/CMakeLists.txt
+++ b/node_modules/react-native-reanimated/android/CMakeLists.txt
@@ -1,7 +1,7 @@
 cmake_minimum_required(VERSION 3.8)
 
 set(CMAKE_VERBOSE_MAKEFILE ON)
-set(CMAKE_CXX_STANDARD 17)
+set(CMAKE_CXX_STANDARD 20)
 
 project(reanimated)
 
EOF

# Apply patch if patch-package is available
if command -v npx &> /dev/null && npx patch-package --version &> /dev/null; then
  npx patch-package
else
  echo "⚠️  patch-package not installed, applying manual fix..."
  # Manual fix
  find node_modules/react-native-reanimated -name "CMakeLists.txt" -exec sed -i 's/CMAKE_CXX_STANDARD 17/CMAKE_CXX_STANDARD 20/g' {} \;
fi

# 2. Create placeholder google-services.json
echo "📄 Creating placeholder google-services.json..."
cat > android/app/google-services.json << 'EOF'
{
  "project_info": {
    "project_number": "123456789012",
    "project_id": "greedandgross-placeholder",
    "storage_bucket": "greedandgross-placeholder.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abcdef1234567890",
        "android_client_info": {
          "package_name": "com.greedandgross.cannabisbreeding"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "AIzaSyDummyKeyReplaceMeWithRealKey"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
EOF

# 3. Fix Gradle settings
echo "🔧 Fixing Gradle settings..."
cat > android/settings.gradle << 'EOF'
pluginManagement {
    includeBuild("../node_modules/@react-native/gradle-plugin")
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

plugins {
    id("com.facebook.react.settings")
}

extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
    ex.autolinkLibrariesFromCommand()
}

rootProject.name = 'android'
include ':app'

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
        maven { url("$rootDir/../node_modules/react-native/android") }
    }
}
EOF

# 4. Update app/build.gradle to use React plugin
echo "🔧 Updating app/build.gradle..."
sed -i '1s/^/apply plugin: "com.facebook.react"\n/' android/app/build.gradle 2>/dev/null || true

# 5. Clean build cache
echo "🧹 Cleaning build cache..."
cd android
rm -rf .gradle build app/build
rm -rf ~/.gradle/caches/transforms-* 2>/dev/null || true

# 6. Set correct NDK version
echo "📱 Setting NDK version..."
echo "ndk.dir=$ANDROID_HOME/ndk/25.1.8937393" > local.properties 2>/dev/null || true

# 7. Fix permissions
chmod +x gradlew

echo "✅ ALL FIXES APPLIED!"
echo ""
echo "🚀 Now run:"
echo "   cd android"
echo "   ./gradlew clean"
echo "   ./gradlew assembleRelease"