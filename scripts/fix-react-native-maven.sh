#!/bin/bash

# Fix React Native Maven artifacts for EAS Build
echo "Fixing React Native Maven artifacts..."

cd android

# Create the Maven directory structure if it doesn't exist
mkdir -p ../node_modules/react-native/android/com/facebook/react/react-native/0.79.0
mkdir -p ../node_modules/react-native/android/com/facebook/react/hermes-android/0.79.0

# Copy artifacts if they exist in the ReactAndroid folder
if [ -d "../node_modules/react-native/ReactAndroid" ]; then
  echo "Copying React Native artifacts..."
  
  # Find and copy AAR files
  find ../node_modules/react-native/ReactAndroid -name "*.aar" -exec cp {} ../node_modules/react-native/android/com/facebook/react/react-native/0.79.0/react-native-0.79.0.aar \; 2>/dev/null || true
  
  # Create POM file
  cat > ../node_modules/react-native/android/com/facebook/react/react-native/0.79.0/react-native-0.79.0.pom << EOF
<?xml version="1.0" encoding="UTF-8"?>
<project xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns="http://maven.apache.org/POM/4.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

  # Create maven-metadata.xml
  cat > ../node_modules/react-native/android/com/facebook/react/react-native/maven-metadata.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <versioning>
    <release>0.79.0</release>
    <versions>
      <version>0.79.0</version>
    </versions>
  </versioning>
</metadata>
EOF
fi

echo "Maven artifacts fix completed"