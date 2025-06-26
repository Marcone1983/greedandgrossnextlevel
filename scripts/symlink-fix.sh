#!/bin/bash
set -e

echo "Creating symlink for React Native dependencies..."

# Remove old local-maven if exists
rm -rf local-maven

# Create symlink to actual React Native Maven repository
ln -s node_modules/react-native/android local-maven

echo "Symlink created!"

# Also create a maven-metadata-local.xml for each artifact to help with version resolution
if [ -d "node_modules/react-native/android/com/facebook/react" ]; then
  cd node_modules/react-native/android/com/facebook/react
else
  echo "React Native Maven directory not found, skipping metadata creation"
  exit 0
fi

for module in react-native react-android hermes-android; do
  if [ -d "$module/0.79.0" ]; then
    cd "$module"
    cat > maven-metadata-local.xml << EOF
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
  fi
done

echo "Metadata files created!"