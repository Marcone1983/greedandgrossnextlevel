#!/bin/bash

# Fix React Native dependencies for all modules

echo "Fixing React Native module dependencies..."

# Function to add React Native dependency to a module's build.gradle
fix_module_gradle() {
    local module_dir="$1"
    local build_file="$module_dir/build.gradle"
    
    if [ -f "$build_file" ]; then
        echo "Checking $build_file..."
        
        # Check if it already has React Native dependency
        if ! grep -q "com.facebook.react:react-android" "$build_file"; then
            # Check if it has a dependencies block
            if grep -q "dependencies {" "$build_file"; then
                echo "Adding React Native dependency to $build_file..."
                
                # Add React Native dependency after dependencies {
                sed -i '/dependencies {/a\    implementation("com.facebook.react:react-android")' "$build_file"
            fi
        fi
    fi
}

# Find all node_modules that might need React Native
find ../node_modules -name "build.gradle" -path "*/android/*" | while read -r gradle_file; do
    module_dir=$(dirname "$gradle_file")
    
    # Skip if it's the React Native module itself
    if [[ ! "$gradle_file" =~ "react-native/android" ]]; then
        fix_module_gradle "$module_dir"
    fi
done

# Also ensure gradle.properties has the right settings
if [ -f "gradle.properties" ]; then
    echo "Checking gradle.properties..."
    
    # Ensure React Native version is set
    if ! grep -q "reactNativeVersion=" "gradle.properties"; then
        echo "reactNativeVersion=0.79.0" >> gradle.properties
    fi
fi

echo "React Native module dependencies fix complete!"
echo "Now run: cd GreedGross && ./gradlew clean && ./gradlew assembleRelease"