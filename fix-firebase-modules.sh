#!/bin/bash

echo "🔧 Fixing Firebase modules for Gradle 8.8 compatibility..."

# Function to comment out problematic publishing block
fix_firebase_module() {
    local module=$1
    local build_file="node_modules/@react-native-firebase/$module/android/build.gradle"
    
    if [ -f "$build_file" ]; then
        echo "Fixing @react-native-firebase/$module..."
        
        # Create a temporary file with the fix
        sed '/afterEvaluate {/,/^}/s/^/\/\/ /' "$build_file" > "$build_file.tmp"
        
        # Replace the original file
        mv "$build_file.tmp" "$build_file"
    fi
}

# Fix all Firebase modules
fix_firebase_module "app"
fix_firebase_module "auth"
fix_firebase_module "firestore"
fix_firebase_module "storage"
fix_firebase_module "analytics"

echo "✅ Firebase modules fixed!"