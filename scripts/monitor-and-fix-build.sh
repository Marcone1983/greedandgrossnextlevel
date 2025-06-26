#!/bin/bash

echo "=== Build Error Monitor and Auto-Fixer ==="

# Function to analyze and fix errors
analyze_and_fix_error() {
    local error_log="$1"
    
    # Check for C++ standard errors
    if grep -q "no member named 'regular' in namespace 'std'" "$error_log"; then
        echo "DETECTED: C++20 concept error in C++17 build"
        echo "FIX: Applying C++ compatibility patches..."
        ./scripts/fix-cpp-build-errors.sh
        return 0
    fi
    
    # Check for duplicate class errors
    if grep -q "Duplicate class" "$error_log"; then
        echo "DETECTED: Duplicate class error"
        echo "FIX: Cleaning gradle cache and enabling Jetifier..."
        rm -rf ~/.gradle/caches/transforms-3
        echo "android.enableJetifier=true" >> GreedGross/gradle.properties
        return 0
    fi
    
    # Check for missing native module errors
    if grep -q "Could not find method implementation() for arguments" "$error_log"; then
        echo "DETECTED: Missing native module"
        echo "FIX: Re-installing dependencies..."
        npm install --legacy-peer-deps
        return 0
    fi
    
    # Check for SDK version mismatch
    if grep -q "uses-sdk:minSdkVersion .* cannot be smaller than" "$error_log"; then
        echo "DETECTED: SDK version mismatch"
        echo "FIX: Updating minSdkVersion to 24..."
        sed -i 's/minSdkVersion = [0-9]*/minSdkVersion = 24/g' GreedGross/build.gradle
        return 0
    fi
    
    # Check for Hermes errors
    if grep -q "hermesEnabled" "$error_log" || grep -q "Hermes" "$error_log"; then
        echo "DETECTED: Hermes configuration issue"
        echo "FIX: Forcing Hermes enabled..."
        echo "hermesEnabled=true" >> GreedGross/gradle.properties
        return 0
    fi
    
    # Check for CMake errors
    if grep -q "CMake Error" "$error_log" || grep -q "ninja: error" "$error_log"; then
        echo "DETECTED: CMake/Ninja build error"
        echo "FIX: Cleaning CMake cache..."
        find node_modules -name ".cxx" -type d -exec rm -rf {} + 2>/dev/null || true
        return 0
    fi
    
    # Check for signing configuration errors
    if grep -q "Keystore file .* not found" "$error_log"; then
        echo "DETECTED: Missing keystore"
        echo "FIX: Using debug keystore..."
        sed -i 's/signingConfig signingConfigs.release/signingConfig signingConfigs.debug/g' GreedGross/app/build.gradle
        return 0
    fi
    
    # Check for Firebase configuration errors
    if grep -q "google-services.json" "$error_log"; then
        echo "DETECTED: Missing google-services.json"
        echo "FIX: Creating placeholder google-services.json..."
        cat > GreedGross/app/google-services.json << 'EOF'
{
  "project_info": {
    "project_number": "123456789",
    "project_id": "placeholder-project"
  },
  "client": [{
    "client_info": {
      "mobilesdk_app_id": "1:123456789:android:abcdef",
      "android_client_info": {
        "package_name": "com.greedandgross.cannabisbreeding"
      }
    },
    "api_key": [{
      "current_key": "placeholder-key"
    }]
  }]
}
EOF
        return 0
    fi
    
    # Check for OutOfMemoryError
    if grep -q "OutOfMemoryError" "$error_log" || grep -q "Java heap space" "$error_log"; then
        echo "DETECTED: Out of memory error"
        echo "FIX: Increasing JVM heap size..."
        sed -i 's/org.gradle.jvmargs=.*/org.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError/' GreedGross/gradle.properties
        return 0
    fi
    
    return 1
}

# Main monitoring loop
if [ "$1" == "once" ]; then
    # Run once mode
    if [ -f "build.log" ]; then
        echo "Analyzing build.log..."
        if analyze_and_fix_error "build.log"; then
            echo "Applied fix! Please retry the build."
        else
            echo "No automatic fix available for this error."
            echo "Last 50 lines of error log:"
            tail -50 build.log
        fi
    else
        echo "No build.log found."
    fi
else
    # Continuous monitoring mode
    echo "Starting continuous build monitoring..."
    echo "Press Ctrl+C to stop"
    
    while true; do
        if [ -f "build.log" ]; then
            # Check if build.log was modified in the last 5 minutes
            if [ "$(find build.log -mmin -5 2>/dev/null)" ]; then
                echo "Checking for errors..."
                if analyze_and_fix_error "build.log"; then
                    echo "Fix applied! Waiting for next build..."
                    # Wait a bit before checking again
                    sleep 30
                fi
            fi
        fi
        
        # Also check GitHub Actions logs if available
        if command -v gh &> /dev/null; then
            # Get latest workflow run
            latest_run=$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null)
            if [ -n "$latest_run" ]; then
                # Download logs
                gh run view "$latest_run" --log 2>/dev/null > gh-build.log
                if [ -s "gh-build.log" ]; then
                    if analyze_and_fix_error "gh-build.log"; then
                        echo "Fix identified from GitHub Actions logs!"
                    fi
                fi
            fi
        fi
        
        sleep 10
    done
fi