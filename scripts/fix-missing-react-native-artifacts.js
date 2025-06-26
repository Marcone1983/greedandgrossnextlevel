#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing missing React Native artifacts...');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const reactNativeAndroidPath = path.join(nodeModulesPath, 'react-native', 'android', 'com', 'facebook', 'react');

// Lista degli artifacts React Native che devono esistere per entrambe le versioni
const artifacts = [
  'react-native',
  'react-android', 
  'hermes-android',
  'react-native-gradle-plugin'
];

// Funzione per creare copie degli artifacts
function createVersionCopy(artifactName, fromVersion, toVersion) {
  const fromDir = path.join(reactNativeAndroidPath, artifactName, fromVersion);
  const toDir = path.join(reactNativeAndroidPath, artifactName, toVersion);
  
  // Se la directory di destinazione non esiste, creala
  if (!fs.existsSync(toDir) && fs.existsSync(fromDir)) {
    fs.mkdirSync(toDir, { recursive: true });
    
    // Copia tutti i file dalla versione esistente
    const files = fs.readdirSync(fromDir);
    files.forEach(file => {
      const srcFile = path.join(fromDir, file);
      let destFile = path.join(toDir, file);
      
      // Rinomina i file per riflettere la nuova versione
      if (file.includes(fromVersion)) {
        destFile = path.join(toDir, file.replace(fromVersion, toVersion));
      }
      
      // Copia il file
      if (fs.statSync(srcFile).isFile()) {
        let content = fs.readFileSync(srcFile);
        
        // Se è un file POM, aggiorna la versione nel contenuto
        if (file.endsWith('.pom')) {
          content = content.toString().replace(new RegExp(fromVersion, 'g'), toVersion);
        }
        
        fs.writeFileSync(destFile, content);
        console.log(`Created: ${destFile}`);
      }
    });
  }
}

// Assicurati che esistano entrambe le versioni per ogni artifact
artifacts.forEach(artifact => {
  const artifactPath = path.join(reactNativeAndroidPath, artifact);
  
  if (fs.existsSync(artifactPath)) {
    // Controlla quali versioni esistono
    const has079 = fs.existsSync(path.join(artifactPath, '0.79.0'));
    const has080 = fs.existsSync(path.join(artifactPath, '0.80.0'));
    
    // Se esiste solo 0.80.0, crea 0.79.0
    if (!has079 && has080) {
      console.log(`Creating 0.79.0 from 0.80.0 for ${artifact}`);
      createVersionCopy(artifact, '0.80.0', '0.79.0');
    }
    
    // Se esiste solo 0.79.0, crea 0.80.0
    if (has079 && !has080) {
      console.log(`Creating 0.80.0 from 0.79.0 for ${artifact}`);
      createVersionCopy(artifact, '0.79.0', '0.80.0');
    }
  }
});

// Crea anche i metadata Maven per supportare entrambe le versioni
artifacts.forEach(artifact => {
  const metadataPath = path.join(reactNativeAndroidPath, artifact, 'maven-metadata.xml');
  const metadataContent = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>com.facebook.react</groupId>
  <artifactId>${artifact}</artifactId>
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
  
  fs.writeFileSync(metadataPath, metadataContent);
  console.log(`Created maven-metadata.xml for ${artifact}`);
});

console.log('React Native artifacts fix completed');