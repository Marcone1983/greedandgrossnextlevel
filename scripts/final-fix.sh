#!/bin/bash
set -e

echo "Applying final comprehensive fix..."

# Create a gradle properties file to force resolution
cat > gradle.properties << 'EOF'
android.useAndroidX=true
android.enableJetifier=true
org.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=512m
EOF

# Create init script that forces everything
mkdir -p ~/.gradle/init.d/

cat > ~/.gradle/init.d/force-all.gradle << 'EOF'
// Force repositories everywhere
gradle.allprojects {
    buildscript {
        repositories {
            mavenLocal()
            maven { url "${rootDir}/../node_modules/react-native/android" }
            google()
            mavenCentral()
        }
    }
    repositories {
        mavenLocal()
        maven { url "${rootDir}/../node_modules/react-native/android" }
        google()
        mavenCentral()
    }
}

// Force dependency resolution
allprojects {
    configurations.all {
        resolutionStrategy {
            force 'com.facebook.react:react-native:0.79.0'
            force 'com.facebook.react:react-android:0.79.0'
            force 'com.facebook.react:hermes-android:0.79.0'
        }
    }
    
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            android {
                compileSdk 34
                
                defaultConfig {
                    if (!hasProperty('minSdk') || minSdk < 24) {
                        minSdk 24
                    }
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

echo "Final fix applied!"