#!/bin/bash

echo "Creating React Native Maven files..."

# Vai nella directory di react-native
cd node_modules/react-native/android/com/facebook/react || exit 1

# Crea le directory e i file per 0.79.0
for artifact in react-native react-android hermes-android react-native-gradle-plugin; do
  echo "Creating $artifact/0.79.0..."
  mkdir -p "$artifact/0.79.0"
  
  # Crea il POM file
  cat > "$artifact/0.79.0/$artifact-0.79.0.pom" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>$artifact</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

  # Crea un AAR vuoto
  echo "PK" > "$artifact/0.79.0/$artifact-0.79.0.aar"
done

echo "Maven files created"