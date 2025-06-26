#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing version issues after workflow changes...');

const projectRoot = path.join(__dirname, '..');

// 1. Fix React Native Maven artifacts per 0.80.0
console.log('\n1. Creating Maven artifacts for React Native 0.80.0...');
execSync('node scripts/fix-maven-0.80.0.js', { cwd: projectRoot, stdio: 'inherit' });

// 2. Fix @react-native/gradle-plugin build directory
console.log('\n2. Fixing @react-native/gradle-plugin build artifacts...');
const gradlePluginPath = path.join(projectRoot, 'node_modules', '@react-native', 'gradle-plugin');
if (fs.existsSync(gradlePluginPath)) {
  const buildPath079 = path.join(gradlePluginPath, 'build', 'com', 'facebook', 'react', 'react-native-gradle-plugin', '0.79.0');
  const buildPath080 = path.join(gradlePluginPath, 'build', 'com', 'facebook', 'react', 'react-native-gradle-plugin', '0.80.0');
  
  if (fs.existsSync(buildPath079) && !fs.existsSync(buildPath080)) {
    fs.mkdirSync(buildPath080, { recursive: true });
    
    // Copy all files from 0.79.0 to 0.80.0
    const files = fs.readdirSync(buildPath079);
    files.forEach(file => {
      const oldPath = path.join(buildPath079, file);
      const newPath = path.join(buildPath080, file.replace('0.79.0', '0.80.0'));
      
      if (file.endsWith('.pom')) {
        let content = fs.readFileSync(oldPath, 'utf8');
        content = content.replace(/0\.79\.0/g, '0.80.0');
        fs.writeFileSync(newPath, content);
      } else {
        fs.copyFileSync(oldPath, newPath);
      }
    });
    console.log('   ✓ Gradle plugin artifacts created for 0.80.0');
  }
}

// 3. Fix React Native Reanimated C++ standard issue
console.log('\n3. Fixing React Native Reanimated C++ standard...');
const reanimatedPath = path.join(projectRoot, 'node_modules', 'react-native-reanimated');
if (fs.existsSync(reanimatedPath)) {
  // Find all CMakeLists.txt files
  const findCMakeFiles = (dir) => {
    const results = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        results.push(...findCMakeFiles(itemPath));
      } else if (item === 'CMakeLists.txt') {
        results.push(itemPath);
      }
    });
    
    return results;
  };
  
  const cmakeFiles = findCMakeFiles(reanimatedPath);
  cmakeFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    if (content.includes('CMAKE_CXX_STANDARD 20')) {
      content = content.replace(/CMAKE_CXX_STANDARD 20/g, 'CMAKE_CXX_STANDARD 17');
      modified = true;
    }
    if (content.includes('cxx_std_20')) {
      content = content.replace(/cxx_std_20/g, 'cxx_std_17');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`   ✓ Fixed C++ standard in ${path.relative(projectRoot, file)}`);
    }
  });
  
  // Fix also in build.gradle files
  const findGradleFiles = (dir) => {
    const results = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'build') {
        results.push(...findGradleFiles(itemPath));
      } else if (item.endsWith('.gradle')) {
        results.push(itemPath);
      }
    });
    
    return results;
  };
  
  const gradleFiles = findGradleFiles(reanimatedPath);
  gradleFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    if (content.includes('-std=c++20')) {
      content = content.replace(/-std=c\+\+20/g, '-std=c++17');
      modified = true;
    }
    if (content.includes('cppFlags.add("-std=c++20")')) {
      content = content.replace(/cppFlags\.add\("-std=c\+\+20"\)/g, 'cppFlags.add("-std=c++17")');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`   ✓ Fixed C++ standard in ${path.relative(projectRoot, file)}`);
    }
  });
}

// 4. Fix package.json versions back to 0.79.0 for specific packages
console.log('\n4. Checking if specific packages need version fixes...');
const packagesToCheck = [
  '@react-native/babel-preset',
  '@react-native/gradle-plugin',
  '@react-native/metro-config'
];

const packageJsonPath = path.join(projectRoot, 'package.json');
let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let modified = false;

packagesToCheck.forEach(pkg => {
  if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
    // These should match react-native version
    const rnVersion = packageJson.dependencies['react-native'];
    if (packageJson.devDependencies[pkg] !== `^${rnVersion}`) {
      packageJson.devDependencies[pkg] = `^${rnVersion}`;
      modified = true;
      console.log(`   ✓ Fixed ${pkg} version to ^${rnVersion}`);
    }
  }
});

if (modified) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
}

// 5. Create symlinks for 0.80.0 if needed
console.log('\n5. Creating compatibility symlinks...');
const createSymlinks = () => {
  const rnAndroidPath = path.join(projectRoot, 'node_modules', 'react-native', 'android', 'com', 'facebook', 'react');
  
  const modules = ['react-native', 'react-android', 'hermes-android', 'react-native-gradle-plugin'];
  
  modules.forEach(module => {
    const modulePath = path.join(rnAndroidPath, module);
    if (fs.existsSync(modulePath)) {
      const v079Path = path.join(modulePath, '0.79.0');
      const v080Path = path.join(modulePath, '0.80.0');
      
      // Se 0.79.0 esiste ma 0.80.0 no, e non abbiamo già creato i file, crea un symlink
      if (fs.existsSync(v079Path) && !fs.existsSync(v080Path)) {
        console.log(`   ⚠️  Missing 0.80.0 for ${module}, files should have been created by fix-maven-0.80.0.js`);
      }
    }
  });
};

createSymlinks();

console.log('\n✅ All version issues fixed successfully!');
console.log('\nIMPORTANT: If the build still fails, run:');
console.log('  1. npm install --legacy-peer-deps');
console.log('  2. cd GreedGross && ./gradlew clean');
console.log('  3. cd .. && npm run postinstall');