#!/bin/bash
set -e

echo "Applying ultimate React Native dependency fix..."

# Create a global init script that forces repositories
mkdir -p ~/.gradle/init.d/

cat > ~/.gradle/init.d/react-native-fix.gradle << 'EOF'
allprojects {
    buildscript {
        repositories {
            maven { url file("${rootDir}/../local-maven") }
            maven { url file("${rootDir}/../node_modules/react-native/android") }
        }
    }
    
    repositories {
        maven { url file("${rootDir}/../local-maven") }
        maven { url file("${rootDir}/../node_modules/react-native/android") }
    }
}

// Force resolve strategy
allprojects {
    configurations.all {
        resolutionStrategy {
            eachDependency { DependencyResolveDetails details ->
                if (details.requested.group == 'com.facebook.react' && details.requested.name == 'react-native') {
                    details.useVersion '0.79.0'
                }
                if (details.requested.group == 'com.facebook.react' && details.requested.name == 'react-android') {
                    details.useVersion '0.79.0'
                }
                if (details.requested.group == 'com.facebook.react' && details.requested.name == 'hermes-android') {
                    details.useVersion '0.79.0'
                }
            }
        }
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

# Also create metadata files
cd local-maven/com/facebook/react

for module in react-native react-android hermes-android; do
  cd $module
  
  # Create maven-metadata.xml
  cat > maven-metadata.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>com.facebook.react</groupId>
  <artifactId>$module</artifactId>
  <versioning>
    <release>0.79.0</release>
    <versions>
      <version>0.79.0</version>
    </versions>
    <lastUpdated>$(date +%Y%m%d%H%M%S)</lastUpdated>
  </versioning>
</metadata>
EOF
  
  cd ..
done

echo "Ultimate fix applied!"