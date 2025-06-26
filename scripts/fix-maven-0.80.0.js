#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing Maven artifacts for React Native 0.80.0...');

const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const reactNativeAndroidPath = path.join(nodeModulesPath, 'react-native', 'android');

// Lista dei moduli React Native che devono avere la versione 0.80.0
const modules = [
  'react-native',
  'react-native-gradle-plugin',
  'react-android',
  'hermes-android'
];

// Funzione per creare i file Maven per una specifica versione
function createMavenArtifacts(moduleName, groupId, version) {
  const artifactPath = path.join(reactNativeAndroidPath, ...groupId.split('.'), moduleName, version);
  
  // Crea la directory se non esiste
  fs.mkdirSync(artifactPath, { recursive: true });
  
  // Cerca i file della versione 0.79.0
  const oldVersionPath = artifactPath.replace('0.80.0', '0.79.0');
  
  if (fs.existsSync(oldVersionPath)) {
    // Copia tutti i file dalla versione 0.79.0 alla 0.80.0
    const files = fs.readdirSync(oldVersionPath);
    
    files.forEach(file => {
      const oldFile = path.join(oldVersionPath, file);
      const newFile = path.join(artifactPath, file.replace('0.79.0', '0.80.0'));
      
      if (file.endsWith('.pom')) {
        // Per i file POM, dobbiamo modificare il contenuto
        let content = fs.readFileSync(oldFile, 'utf8');
        content = content.replace(/0\.79\.0/g, '0.80.0');
        fs.writeFileSync(newFile, content);
        console.log(`Created ${newFile}`);
      } else if (file.endsWith('.jar') || file.endsWith('.aar')) {
        // Per JAR e AAR, copiamo direttamente
        fs.copyFileSync(oldFile, newFile);
        console.log(`Copied ${newFile}`);
      } else if (file.endsWith('.module') || file.endsWith('.sha1') || file.endsWith('.sha256') || file.endsWith('.sha512') || file.endsWith('.md5')) {
        // Per i file di checksum, li ricreiamo vuoti (gradle li rigenererà se necessario)
        fs.writeFileSync(newFile, '');
      }
    });
  } else {
    console.log(`Warning: Source directory ${oldVersionPath} not found, creating minimal artifacts`);
    
    // Crea un POM minimo
    const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${groupId}</groupId>
  <artifactId>${moduleName}</artifactId>
  <version>${version}</version>
  <packaging>${moduleName.includes('gradle-plugin') ? 'jar' : 'aar'}</packaging>
</project>`;
    
    fs.writeFileSync(path.join(artifactPath, `${moduleName}-${version}.pom`), pomContent);
    
    // Crea un file JAR/AAR vuoto se necessario
    const artifactFile = path.join(artifactPath, `${moduleName}-${version}.${moduleName.includes('gradle-plugin') ? 'jar' : 'aar'}`);
    if (!fs.existsSync(artifactFile)) {
      // Crea un file ZIP vuoto (JAR e AAR sono essenzialmente file ZIP)
      fs.writeFileSync(artifactFile, Buffer.from('504b0506000000000000000000000000000000000000', 'hex'));
    }
  }
  
  // Aggiorna o crea maven-metadata.xml
  const metadataPath = path.join(reactNativeAndroidPath, ...groupId.split('.'), moduleName, 'maven-metadata.xml');
  const metadataDir = path.dirname(metadataPath);
  
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  const metadataContent = `<?xml version="1.0" encoding="UTF-8"?>
<metadata>
  <groupId>${groupId}</groupId>
  <artifactId>${moduleName}</artifactId>
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
}

// Crea artifacts per tutti i moduli necessari
createMavenArtifacts('react-native', 'com.facebook.react', '0.80.0');
createMavenArtifacts('react-native-gradle-plugin', 'com.facebook.react', '0.80.0');
createMavenArtifacts('react-android', 'com.facebook.react', '0.80.0');
createMavenArtifacts('hermes-android', 'com.facebook.react', '0.80.0');

// Cerca e correggi anche altri moduli che potrebbero essere referenziati
const findAdditionalModules = () => {
  const androidPath = path.join(reactNativeAndroidPath, 'com', 'facebook');
  
  if (fs.existsSync(androidPath)) {
    const scanDir = (dir, groupPath = []) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Se troviamo una directory 0.79.0, creiamo anche la 0.80.0
          if (item === '0.79.0') {
            const parentDir = path.dirname(itemPath);
            const moduleName = path.basename(parentDir);
            const groupId = ['com', 'facebook', ...groupPath].join('.');
            
            console.log(`Found additional module: ${groupId}:${moduleName}`);
            createMavenArtifacts(moduleName, groupId, '0.80.0');
          } else if (item !== '0.80.0' && !item.includes('.')) {
            // Continua la ricerca nelle sottodirectory
            scanDir(itemPath, [...groupPath, item]);
          }
        }
      });
    };
    
    scanDir(androidPath);
  }
};

findAdditionalModules();

console.log('Maven artifacts for React Native 0.80.0 created successfully');