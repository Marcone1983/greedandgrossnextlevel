#!/bin/bash
set -e

echo "Applying simple React Native fix..."

# Remove our fake local maven repo since the real files exist
rm -rf local-maven

# Create Gradle init script that just adds the repositories
mkdir -p ~/.gradle/init.d/

cat > ~/.gradle/init.d/react-native-fix.gradle << 'EOF'
allprojects {
    repositories {
        // Add React Native repository first
        maven { 
            url file("${rootDir}/../node_modules/react-native/android")
            content {
                includeGroup "com.facebook.react"
            }
        }
        maven { url file("${rootDir}/../node_modules/jsc-android/dist") }
    }
}

// Fix SDK and Java versions
allprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            android {
                if (!hasProperty('compileSdkVersion') || compileSdkVersion == null) {
                    compileSdkVersion 34
                }
                
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
    }
}
EOF

echo "Simple fix applied!"