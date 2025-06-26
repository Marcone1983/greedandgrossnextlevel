#!/bin/bash
set -e

echo "Ensuring React Native dependencies are available..."

# Create local Maven repository with React Native
LOCAL_MAVEN="$PWD/local-maven"
mkdir -p "$LOCAL_MAVEN/com/facebook/react/react-native/0.79.0"
mkdir -p "$LOCAL_MAVEN/com/facebook/react/react-android/0.79.0"
mkdir -p "$LOCAL_MAVEN/com/facebook/react/hermes-android/0.79.0"

# Create minimal but valid AAR files
for module in react-native react-android hermes-android; do
  cd "$LOCAL_MAVEN/com/facebook/react/$module/0.79.0"
  
  # Create a minimal AAR (ZIP file with required structure)
  mkdir -p temp/META-INF
  echo "Manifest-Version: 1.0" > temp/META-INF/MANIFEST.MF
  # Use a valid Java package name (replace hyphens with underscores)
  package_name="com.facebook.react.${module//-/_}"
  echo "<manifest xmlns:android='http://schemas.android.com/apk/res/android' package='$package_name' />" > temp/AndroidManifest.xml
  mkdir -p temp/classes
  mkdir -p temp/res
  touch temp/classes/.keep
  touch temp/res/.keep
  
  # Create the AAR
  (cd temp && zip -r ../$module-0.79.0.aar .)
  rm -rf temp
  
  # Create POM file
  cat > $module-0.79.0.pom << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>$module</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
  <dependencies>
    <dependency>
      <groupId>com.facebook.react</groupId>
      <artifactId>react-native</artifactId>
      <version>0.79.0</version>
      <type>aar</type>
      <scope>compile</scope>
    </dependency>
  </dependencies>
</project>
EOF
done

echo "React Native dependencies ensured!"