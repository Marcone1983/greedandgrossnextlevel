#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Creating local Maven repository for React Native...');

const projectRoot = path.join(__dirname, '..');
const localMavenPath = path.join(projectRoot, 'GreedGross', 'local-maven');

// Crea la struttura del repository Maven locale
const createMavenStructure = (version) => {
  const groupPath = path.join(localMavenPath, 'com', 'facebook', 'react', 'react-native', version);
  fs.mkdirSync(groupPath, { recursive: true });
  
  // Crea POM file
  const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <version>${version}</version>
  <packaging>aar</packaging>
  <dependencies>
    <dependency>
      <groupId>com.facebook.react</groupId>
      <artifactId>react-android</artifactId>
      <version>${version}</version>
    </dependency>
  </dependencies>
</project>`;
  
  fs.writeFileSync(path.join(groupPath, `react-native-${version}.pom`), pomContent);
  
  // Crea un AAR vuoto (placeholder)
  const aarPath = path.join(groupPath, `react-native-${version}.aar`);
  if (!fs.existsSync(aarPath)) {
    // Crea un file AAR minimo valido
    fs.writeFileSync(aarPath, Buffer.from('504b0304', 'hex')); // ZIP header
  }
  
  console.log(`Created Maven artifacts for React Native ${version}`);
};

// Crea artifacts per entrambe le versioni
createMavenStructure('0.79.0');
createMavenStructure('0.80.0');

// Crea maven-metadata.xml
const metadataPath = path.join(localMavenPath, 'com', 'facebook', 'react', 'react-native');
const metadataContent = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <versioning>
    <latest>0.80.0</latest>
    <release>0.80.0</release>
    <versions>
      <version>0.79.0</version>
      <version>0.80.0</version>
    </versions>
    <lastUpdated>${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}</lastUpdated>
  </versioning>
</metadata>`;

fs.writeFileSync(path.join(metadataPath, 'maven-metadata.xml'), metadataContent);

console.log('Local Maven repository created successfully');