#!/bin/bash

echo "=== Fixing Common Android Build Errors ==="

# 1. Fix duplicate class errors
echo "1. Preventing duplicate class errors..."
cat >> android/gradle.properties << 'EOF'

# Prevent duplicate class errors
android.enableJetifier=true
android.useAndroidX=true
android.enableDexingArtifactTransform=false
EOF

# 2. Fix memory issues
echo "2. Optimizing memory settings..."
sed -i 's/org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8/' android/gradle.properties

# 3. Fix SDK version issues
echo "3. Ensuring consistent SDK versions..."
cat > fix-sdk-versions.gradle << 'EOF'
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            android {
                compileSdkVersion 34
                buildToolsVersion "34.0.0"
                
                defaultConfig {
                    targetSdkVersion 34
                    if (minSdkVersion < 24) {
                        minSdkVersion 24
                    }
                }
            }
        }
    }
}
EOF

# 4. Fix missing repositories
echo "4. Ensuring all repositories are available..."
if [ -f "android/build.gradle" ]; then
    # Ensure all required repositories are present
    sed -i '/allprojects {/,/^}/ {
        /repositories {/,/^    }/ {
            /mavenCentral()/! {
                /google()/a\
        mavenCentral()
            }
            /maven { url "https:\/\/www.jitpack.io" }/! {
                /mavenCentral()/a\
        maven { url "https://www.jitpack.io" }
            }
        }
    }' android/build.gradle
fi

# 5. Fix React Native autolinking issues
echo "5. Fixing React Native autolinking..."
# Ensure react-native.config.js is correct
cat > react-native.config.js << 'EOF'
module.exports = {
  project: {
    ios: {},
    android: {
      sourceDir: './android',
      manifestPath: 'app/src/main/AndroidManifest.xml',
      packageName: 'com.greedandgross.cannabisbreeding',
    },
  },
  dependencies: {
    // Fix for modules that don't autolink properly
    'react-native-vector-icons': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-vector-icons/android',
          packageImportPath: 'import com.oblador.vectoricons.VectorIconsPackage;',
        },
      },
    },
  },
};
EOF

# 6. Fix Hermes issues
echo "6. Ensuring Hermes is properly configured..."
# Add Hermes Maven repository
if ! grep -q "maven.*hermesPath" android/build.gradle; then
    sed -i '/allprojects {/,/^}/ {
        /repositories {/,/^    }/ {
            /}$/ i\
        maven { url("$rootDir/../node_modules/react-native/android") }
        }
    }' android/build.gradle
fi

# 7. Fix signing configuration
echo "7. Setting up signing configuration..."
# Ensure debug keystore exists
if [ ! -f "android/app/debug.keystore" ]; then
    echo "Creating debug keystore..."
    cd android/app
    keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US" 2>/dev/null || true
    cd ../..
fi

# 8. Clean gradle cache for problematic dependencies
echo "8. Cleaning problematic gradle caches..."
rm -rf ~/.gradle/caches/modules-2/files-2.1/com.facebook.react/react-native/0.79.0 2>/dev/null || true
rm -rf ~/.gradle/caches/transforms-3/*/transformed/jetified-react-android-0.79.0* 2>/dev/null || true

# 9. Create pre-build cleanup script
echo "9. Creating pre-build cleanup script..."
cat > android/pre-build-cleanup.sh << 'EOF'
#!/bin/bash
# Clean build artifacts before build
echo "Cleaning build artifacts..."
rm -rf app/build 2>/dev/null || true
rm -rf .gradle 2>/dev/null || true
rm -rf ~/.gradle/caches/8.10.2/executionHistory 2>/dev/null || true
./gradlew clean 2>/dev/null || true
EOF
chmod +x android/pre-build-cleanup.sh

echo "=== Common Android build error fixes applied! ===