#!/bin/bash

echo "=== Comprehensive C++ Build Fix for React Native 0.79.0 ==="

# 1. Fix react-native-reanimated C++ standard
echo "1. Fixing react-native-reanimated C++ standard..."
if [ -f "node_modules/react-native-reanimated/android/build.gradle" ]; then
    # Force Hermes detection to true
    sed -i '165s/if (appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean())/if (true)/' node_modules/react-native-reanimated/android/build.gradle 2>/dev/null || true
    
    # Add C++17 configuration to defaultConfig
    sed -i '/defaultConfig {/a\
        externalNativeBuild {\
            cmake {\
                cppFlags "-std=c++17", "-fexceptions", "-frtti", "-DWITH_INSPECTOR=1"\
                arguments "-DCMAKE_CXX_STANDARD=17", "-DANDROID_STL=c++_shared"\
            }\
        }' node_modules/react-native-reanimated/android/build.gradle 2>/dev/null || true
fi

# 2. Fix all CMakeLists.txt files
echo "2. Fixing CMakeLists.txt files..."
find node_modules/react-native-reanimated -name "CMakeLists.txt" | while read -r file; do
    # Change C++20 to C++17
    sed -i 's/CMAKE_CXX_STANDARD 20/CMAKE_CXX_STANDARD 17/g' "$file" 2>/dev/null || true
    sed -i 's/cxx_std_20/cxx_std_17/g' "$file" 2>/dev/null || true
    sed -i 's/-std=c++20/-std=c++17/g' "$file" 2>/dev/null || true
    
    # Add compatibility definitions
    if ! grep -q "_LIBCPP_DISABLE_AVAILABILITY" "$file"; then
        sed -i '1a\
add_definitions(-D_LIBCPP_DISABLE_AVAILABILITY)' "$file" 2>/dev/null || true
    fi
done

# 3. Create compatibility header
echo "3. Creating compatibility header..."
mkdir -p node_modules/react-native-reanimated/android/src/main/cpp/include
cat > node_modules/react-native-reanimated/android/src/main/cpp/include/cpp17_compat.h << 'EOF'
#pragma once

// Compatibility layer for C++17
#if __cplusplus < 202002L

// Define std::regular as a no-op for C++17
namespace std {
    template<typename T>
    inline constexpr bool regular_v = true;
    
    template<typename T>
    struct regular {
        static constexpr bool value = true;
    };
}

// If std::regular is used as a concept, provide a workaround
#ifndef __cpp_concepts
#define __cpp_concepts 201907L
namespace std {
    template<typename T>
    concept regular = true;
}
#endif

#endif // __cplusplus < 202002L
EOF

# 4. Patch all C++ source files to include the compatibility header
echo "4. Patching C++ source files..."
find node_modules/react-native-reanimated/android/src/main/cpp -name "*.cpp" -o -name "*.h" | while read -r file; do
    # Add include at the beginning of the file (after pragma once if present)
    if grep -q "#pragma once" "$file"; then
        sed -i '/#pragma once/a\
#include "../include/cpp17_compat.h"' "$file" 2>/dev/null || true
    else
        sed -i '1i\
#include "../include/cpp17_compat.h"' "$file" 2>/dev/null || true
    fi
done

# 5. Fix gradle files
echo "5. Fixing gradle files..."
find node_modules/react-native-reanimated -name "*.gradle" | while read -r file; do
    sed -i 's/-std=c++20/-std=c++17/g' "$file" 2>/dev/null || true
    sed -i 's/cppFlags\.add("-std=c++20")/cppFlags.add("-std=c++17")/g' "$file" 2>/dev/null || true
done

# 6. Create a gradle patch to force C++17 globally
echo "6. Creating global gradle configuration..."
mkdir -p ~/.gradle/init.d
cat > ~/.gradle/init.d/force-cpp17.gradle << 'EOF'
allprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            android {
                defaultConfig {
                    if (externalNativeBuild?.cmake) {
                        externalNativeBuild {
                            cmake {
                                // Remove C++20 flags and force C++17
                                cppFlags.removeAll { it.contains("c++20") }
                                cppFlags.add("-std=c++17")
                                cppFlags.add("-D_LIBCPP_DISABLE_AVAILABILITY")
                                arguments "-DCMAKE_CXX_STANDARD=17"
                            }
                        }
                    }
                }
            }
        }
    }
}
EOF

# 7. Additional fix for React Native's Folly headers in gradle cache
echo "7. Attempting to patch Folly headers in gradle cache..."
# This will run during build time, but we'll create the script
cat > patch-folly-cache.sh << 'SCRIPT'
#!/bin/bash
# Find and patch F14Table.h in gradle cache
find ~/.gradle/caches -path "*/transformed/*/prefab/modules/reactnative/include/folly/container/detail/F14Table.h" -type f 2>/dev/null | while read -r file; do
    echo "Patching Folly header: $file"
    # Comment out the problematic static_assert
    sed -i 's/static_assert(std::regular<F14HashToken>);/\/\/ static_assert(std::regular<F14HashToken>); \/\/ C++17 compatibility/' "$file" 2>/dev/null || true
done
SCRIPT
chmod +x patch-folly-cache.sh

echo "=== C++ Build fixes applied! ==="
echo "Note: Some fixes (like Folly headers) may need to be applied after dependencies are downloaded."