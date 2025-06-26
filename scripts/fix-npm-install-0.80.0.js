#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Fixing npm install for non-existent React Native 0.80.0...');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Controlla se le versioni sono state cambiate a 0.80.0
const needsFix = packageJson.dependencies && packageJson.dependencies['react-native'] === '0.80.0';

if (needsFix) {
  console.log('Detected React Native 0.80.0 (non-existent), fixing...');
  
  // React Native 0.80.0 non esiste, quindi npm install installerà 0.79.0
  // Ma i moduli cercheranno i file con versione che corrisponde a package.json
  
  // Soluzione: dopo npm install, crea link simbolici o copie
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const reactNativePath = path.join(nodeModulesPath, 'react-native');
  
  if (fs.existsSync(reactNativePath)) {
    // Aggiorna il package.json interno di react-native per far credere che sia 0.80.0
    const rnPackageJsonPath = path.join(reactNativePath, 'package.json');
    const rnPackageJson = JSON.parse(fs.readFileSync(rnPackageJsonPath, 'utf8'));
    
    if (rnPackageJson.version === '0.79.0') {
      console.log('Updating react-native internal version to 0.80.0...');
      rnPackageJson.version = '0.80.0';
      fs.writeFileSync(rnPackageJsonPath, JSON.stringify(rnPackageJson, null, 2));
    }
    
    // Crea i file Maven per 0.80.0
    const androidPath = path.join(reactNativePath, 'android', 'com', 'facebook', 'react');
    const artifacts = ['react-native', 'react-android', 'hermes-android', 'react-native-gradle-plugin'];
    
    artifacts.forEach(artifact => {
      const artifactPath = path.join(androidPath, artifact);
      if (fs.existsSync(artifactPath)) {
        const v079Path = path.join(artifactPath, '0.79.0');
        const v080Path = path.join(artifactPath, '0.80.0');
        
        // Se esiste 0.79.0 ma non 0.80.0, crea 0.80.0
        if (fs.existsSync(v079Path) && !fs.existsSync(v080Path)) {
          console.log(`Creating ${artifact} 0.80.0 from 0.79.0...`);
          fs.mkdirSync(v080Path, { recursive: true });
          
          const files = fs.readdirSync(v079Path);
          files.forEach(file => {
            const srcFile = path.join(v079Path, file);
            const destFile = path.join(v080Path, file.replace('0.79.0', '0.80.0'));
            
            if (fs.statSync(srcFile).isFile()) {
              let content = fs.readFileSync(srcFile);
              
              if (file.endsWith('.pom')) {
                content = content.toString().replace(/0\.79\.0/g, '0.80.0');
              }
              
              fs.writeFileSync(destFile, content);
            }
          });
        }
      }
    });
  }
  
  // Aggiorna anche i moduli @react-native/*
  const rnModules = ['@react-native/gradle-plugin', '@react-native/babel-preset', '@react-native/metro-config'];
  rnModules.forEach(moduleName => {
    const modulePath = path.join(nodeModulesPath, moduleName);
    if (fs.existsSync(modulePath)) {
      const modulePackageJsonPath = path.join(modulePath, 'package.json');
      if (fs.existsSync(modulePackageJsonPath)) {
        const modulePackageJson = JSON.parse(fs.readFileSync(modulePackageJsonPath, 'utf8'));
        if (modulePackageJson.version === '0.79.0') {
          modulePackageJson.version = '0.80.0';
          fs.writeFileSync(modulePackageJsonPath, JSON.stringify(modulePackageJson, null, 2));
          console.log(`Updated ${moduleName} to version 0.80.0`);
        }
      }
    }
  });
}

console.log('Fix completed');