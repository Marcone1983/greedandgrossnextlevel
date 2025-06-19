#!/bin/bash

# Fix Gradle Wrapper for GitHub Actions

echo "🔧 Fixing Gradle Wrapper..."

# Remove invalid jar
rm -f android/gradle/wrapper/gradle-wrapper.jar

# Download correct gradle-wrapper.jar for version 8.5
echo "📥 Downloading gradle-wrapper.jar..."
curl -L -o android/gradle/wrapper/gradle-wrapper.jar \
  https://github.com/gradle/gradle/raw/v8.5.0/gradle/wrapper/gradle-wrapper.jar

# Make gradlew executable
chmod +x android/gradlew

# Verify the jar file
if [ -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "✅ gradle-wrapper.jar downloaded successfully"
    ls -la android/gradle/wrapper/gradle-wrapper.jar
else
    echo "❌ Failed to download gradle-wrapper.jar"
    exit 1
fi

echo "🎉 Gradle Wrapper fixed!"