#!/bin/bash
set -e

echo "🔧 Fixing Gradle issues..."

# Clear all gradle caches
echo "Clearing gradle caches..."
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/wrapper/dists/

# Clear Android build directories
echo "Clearing Android build directories..."
find . -type d -name "build" -path "*/android/*" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".gradle" -path "*/android/*" -exec rm -rf {} + 2>/dev/null || true

# Create gradle.properties if missing
if [ ! -f "android/gradle.properties" ]; then
  echo "Creating gradle.properties..."
  cat > android/gradle.properties << 'EOF'
# Project-wide Gradle settings.
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
newArchEnabled=false
hermesEnabled=true
kotlin.code.style=official
# Disable download progress to reduce log noise
org.gradle.console=plain
EOF
fi

# Force gradle wrapper download
echo "Ensuring gradle wrapper..."
cd android
if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
  echo "Downloading gradle wrapper..."
  curl -L https://github.com/gradle/gradle/raw/v8.2/gradle/wrapper/gradle-wrapper.jar -o gradle/wrapper/gradle-wrapper.jar
fi

# Pre-download dependencies
echo "Pre-downloading critical dependencies..."
./gradlew --refresh-dependencies || true

cd ..

echo "✅ Gradle issues fixed!"