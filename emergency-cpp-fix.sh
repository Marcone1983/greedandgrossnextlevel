#!/bin/bash
set -e

echo "🚨 EMERGENCY C++ FIX FOR REACT NATIVE BUILD"

# Fix for C++17/C++20 compatibility issues
echo "📦 Patching all CMakeLists.txt files for C++17..."

# Find and patch all CMakeLists.txt files
find node_modules -name "CMakeLists.txt" -type f | while read file; do
  echo "Patching: $file"
  # Force C++17 standard
  sed -i 's/CMAKE_CXX_STANDARD 20/CMAKE_CXX_STANDARD 17/g' "$file" 2>/dev/null || true
  sed -i 's/CMAKE_CXX_STANDARD 14/CMAKE_CXX_STANDARD 17/g' "$file" 2>/dev/null || true
  sed -i 's/set(CMAKE_CXX_STANDARD 11)/set(CMAKE_CXX_STANDARD 17)/g' "$file" 2>/dev/null || true
  
  # Add C++17 if not present
  if ! grep -q "CMAKE_CXX_STANDARD" "$file"; then
    sed -i '1a set(CMAKE_CXX_STANDARD 17)' "$file" 2>/dev/null || true
  fi
done

# Fix React Native gradle files
echo "🔧 Fixing React Native gradle configurations..."

# Create gradle init script for C++17
mkdir -p ~/.gradle/init.d/
cat > ~/.gradle/init.d/force-cpp17.gradle << 'EOF'
allprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            android {
                defaultConfig {
                    if (project.hasProperty("externalNativeBuild")) {
                        externalNativeBuild {
                            cmake {
                                cppFlags "-std=c++17"
                                arguments "-DANDROID_STL=c++_shared",
                                         "-DCMAKE_CXX_STANDARD=17"
                            }
                        }
                    }
                }
            }
        }
    }
}
EOF

echo "✅ Emergency C++ fixes applied!"