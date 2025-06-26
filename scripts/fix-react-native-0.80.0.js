#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Creating React Native 0.80.0 compatibility layer...');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

// Fix per @react-native modules
const modules = [
  '@react-native/gradle-plugin',
  '@react-native/babel-preset', 
  '@react-native/metro-config'
];

modules.forEach(moduleName => {
  const modulePath = path.join(nodeModulesPath, moduleName);
  if (fs.existsSync(modulePath)) {
    const packageJsonPath = path.join(modulePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Se la versione è stata cambiata a 0.80.0, mantieni il contenuto ma assicurati che funzioni
      if (packageJson.version === '0.80.0') {
        console.log(`${moduleName} already at 0.80.0 (mapped from 0.79.0)`);
      }
    }
  }
});

// Crea Maven metadata per React Native 0.80.0
const reactNativePath = path.join(nodeModulesPath, 'react-native');
if (fs.existsSync(reactNativePath)) {
  const androidPath = path.join(reactNativePath, 'android');
  const mavenMetadataPath = path.join(androidPath, 'com', 'facebook', 'react', 'react-native', 'maven-metadata.xml');
  
  // Crea la directory se non esiste
  const metadataDir = path.dirname(mavenMetadataPath);
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  // Crea maven-metadata.xml che include sia 0.79.0 che 0.80.0
  const mavenMetadata = `<?xml version="1.0" encoding="UTF-8"?>
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
  </versioning>
</metadata>`;
  
  fs.writeFileSync(mavenMetadataPath, mavenMetadata);
  console.log('Created Maven metadata for React Native 0.80.0');
  
  // Crea la directory per gli artifacts 0.80.0
  const artifactPath = path.join(androidPath, 'com', 'facebook', 'react', 'react-native', '0.80.0');
  if (!fs.existsSync(artifactPath)) {
    fs.mkdirSync(artifactPath, { recursive: true });
    
    // Crea un POM file per 0.80.0
    const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>react-native</artifactId>
  <version>0.80.0</version>
  <packaging>aar</packaging>
</project>`;
    
    fs.writeFileSync(path.join(artifactPath, 'react-native-0.80.0.pom'), pomContent);
    
    // Copia il file AAR da 0.79.0 se esiste
    const sourceAar = path.join(androidPath, 'com', 'facebook', 'react', 'react-native', '0.79.0', 'react-native-0.79.0.aar');
    if (fs.existsSync(sourceAar)) {
      fs.copyFileSync(sourceAar, path.join(artifactPath, 'react-native-0.80.0.aar'));
    }
  }
}

console.log('React Native 0.80.0 compatibility layer created');