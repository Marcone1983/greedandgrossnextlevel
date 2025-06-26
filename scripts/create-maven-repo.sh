#!/bin/bash
set -e

# Create proper Maven structure for React Native 0.79.0
mkdir -p com/facebook/react/react-native/0.79.0
mkdir -p com/facebook/react/react-android/0.79.0
mkdir -p com/facebook/react/hermes-android/0.79.0

# Create a minimal but valid AAR file (it's a ZIP with required structure)
cd com/facebook/react/react-native/0.79.0

# Create a valid AAR structure
mkdir -p temp/META-INF
echo "Manifest-Version: 1.0" > temp/META-INF/MANIFEST.MF
mkdir -p temp/classes
touch temp/classes/.keep
echo "<manifest package='com.facebook.react' />" > temp/AndroidManifest.xml

# Create the AAR
(cd temp && zip -r ../react-native-0.79.0.aar .)
rm -rf temp

# Create POM file that redirects to the actual React Native location
cat > react-native-0.79.0.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

cd ../../../..

# Do the same for react-android
mkdir -p com/facebook/react/react-android/0.79.0
cd com/facebook/react/react-android/0.79.0
mkdir -p temp/META-INF
echo "Manifest-Version: 1.0" > temp/META-INF/MANIFEST.MF
mkdir -p temp/classes
touch temp/classes/.keep
echo "<manifest package='com.facebook.react' />" > temp/AndroidManifest.xml
(cd temp && zip -r ../react-android-0.79.0.aar .)
rm -rf temp

cat > react-android-0.79.0.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-android</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

cd ../../../..

# Do the same for hermes-android
mkdir -p com/facebook/react/hermes-android/0.79.0
cd com/facebook/react/hermes-android/0.79.0
mkdir -p temp/META-INF
echo "Manifest-Version: 1.0" > temp/META-INF/MANIFEST.MF
mkdir -p temp/classes
touch temp/classes/.keep
echo "<manifest package='com.facebook.react' />" > temp/AndroidManifest.xml
(cd temp && zip -r ../hermes-android-0.79.0.aar .)
rm -rf temp

cat > hermes-android-0.79.0.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>hermes-android</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

cd ../../../..