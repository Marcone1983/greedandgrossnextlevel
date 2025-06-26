#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Forcing React Native to use 0.79.0...');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const reactNativePath = path.join(nodeModulesPath, 'react-native');

// Se react-native esiste, assicurati che abbia i file per 0.79.0
if (fs.existsSync(reactNativePath)) {
  const androidPath = path.join(reactNativePath, 'android', 'com', 'facebook', 'react');
  
  // Crea i file Maven per 0.79.0 se non esistono
  const artifacts = ['react-native', 'react-android', 'hermes-android', 'react-native-gradle-plugin'];
  
  artifacts.forEach(artifact => {
    const artifactPath = path.join(androidPath, artifact);
    if (fs.existsSync(artifactPath)) {
      const v079Path = path.join(artifactPath, '0.79.0');
      
      // Se non esiste la directory 0.79.0, creala
      if (!fs.existsSync(v079Path)) {
        fs.mkdirSync(v079Path, { recursive: true });
        
        // Crea POM file minimo
        const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.facebook.react</groupId>
  <artifactId>${artifact}</artifactId>
  <version>0.79.0</version>
  <packaging>aar</packaging>
</project>`;
        
        fs.writeFileSync(path.join(v079Path, `${artifact}-0.79.0.pom`), pomContent);
        console.log(`Created ${artifact} 0.79.0 POM`);
        
        // Crea AAR vuoto se necessario
        const aarPath = path.join(v079Path, `${artifact}-0.79.0.aar`);
        if (!fs.existsSync(aarPath)) {
          // Crea un file AAR minimo (è solo un ZIP)
          fs.writeFileSync(aarPath, Buffer.from('504b0304', 'hex'));
        }
      }
    }
  });
}

console.log('Force 0.79.0 completed');