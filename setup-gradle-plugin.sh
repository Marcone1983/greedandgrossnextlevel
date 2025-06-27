#!/bin/bash

# Script to set up React Native Gradle Plugin for local builds

echo "Setting up React Native Gradle Plugin..."

# Create Maven repository structure in both expected locations
mkdir -p node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/0.79.0/
mkdir -p node_modules/@react-native/gradle-plugin/build/com/facebook/react/react-native-gradle-plugin/0.79.0/

# Copy the JAR files if they exist
if [ -f "node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build/libs/react-native-gradle-plugin.jar" ]; then
    echo "Copying react-native-gradle-plugin JAR..."
    cp node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build/libs/react-native-gradle-plugin.jar \
       node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/0.79.0/react-native-gradle-plugin-0.79.0.jar
    
    cp node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build/libs/react-native-gradle-plugin.jar \
       node_modules/@react-native/gradle-plugin/build/com/facebook/react/react-native-gradle-plugin/0.79.0/react-native-gradle-plugin-0.79.0.jar
else
    echo "ERROR: react-native-gradle-plugin.jar not found!"
    echo "Please build the gradle plugin first by running:"
    echo "cd node_modules/@react-native/gradle-plugin && ./gradlew build"
    exit 1
fi

# Create POM files
cat > node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/0.79.0/react-native-gradle-plugin-0.79.0.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.facebook.react</groupId>
    <artifactId>react-native-gradle-plugin</artifactId>
    <version>0.79.0</version>
</project>
EOF

cp node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/0.79.0/react-native-gradle-plugin-0.79.0.pom \
   node_modules/@react-native/gradle-plugin/build/com/facebook/react/react-native-gradle-plugin/0.79.0/react-native-gradle-plugin-0.79.0.pom

# Create Maven metadata
cat > node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/maven-metadata.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native-gradle-plugin</artifactId>
  <versioning>
    <latest>0.79.0</latest>
    <release>0.79.0</release>
    <versions>
      <version>0.79.0</version>
    </versions>
  </versioning>
</metadata>
EOF

cp node_modules/react-native/android/com/facebook/react/react-native-gradle-plugin/maven-metadata.xml \
   node_modules/@react-native/gradle-plugin/build/com/facebook/react/react-native-gradle-plugin/maven-metadata.xml

echo "React Native Gradle Plugin setup complete!"
echo ""
echo "You can now run your Android build with:"
echo "cd android && ./gradlew assembleRelease"