#!/bin/bash

# Crea un repository Maven locale per React Native
echo "Creating local Maven repository for React Native..."

cd node_modules/react-native/android

# Assicurati che la struttura esista
mkdir -p com/facebook/react/react-native/0.79.0

# Crea un POM minimo
cat > com/facebook/react/react-native/0.79.0/react-native-0.79.0.pom << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>
EOF

# Crea un AAR vuoto (è solo un file ZIP)
echo "UEsDBAoAAAAAAIdO4kgAAAAAAAAAAAAAAAAJAAAATUVUQS1JTkYvUEsBAhQACgAAAAAAh07iSAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAE1FVEEtSU5GL1BLBQYAAAAAAQABADoAAAAyAAAAAAA=" | base64 -d > com/facebook/react/react-native/0.79.0/react-native-0.79.0.aar

# Crea maven-metadata.xml
cat > com/facebook/react/react-native/maven-metadata.xml << 'EOF'
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

echo "Local Maven repository created"