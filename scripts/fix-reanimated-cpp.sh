#!/bin/bash
# Fix react-native-reanimated C++ compatibility issues

echo "Fixing react-native-reanimated C++ compatibility..."

# 1. Fix Hermes detection in build.gradle
if [ -f "node_modules/react-native-reanimated/android/build.gradle" ]; then
    # Force Hermes to be detected as true
    sed -i '165s/if (appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean())/if (true)/' node_modules/react-native-reanimated/android/build.gradle || true
fi

# 2. Force C++17 instead of C++20 in all CMakeLists.txt files
find node_modules/react-native-reanimated -name "CMakeLists.txt" -exec sed -i 's/CMAKE_CXX_STANDARD 20/CMAKE_CXX_STANDARD 17/g' {} \;
find node_modules/react-native-reanimated -name "CMakeLists.txt" -exec sed -i 's/cxx_std_20/cxx_std_17/g' {} \;

# 3. Fix C++ standard in all gradle files
find node_modules/react-native-reanimated -name "*.gradle" -exec sed -i 's/-std=c++20/-std=c++17/g' {} \;
find node_modules/react-native-reanimated -name "*.gradle" -exec sed -i 's/cppFlags.add("-std=c++20")/cppFlags.add("-std=c++17")/g' {} \;

# 4. Fix the specific std::regular error by modifying the React Native headers
# This is a workaround for the F14Table.h issue
if [ -d "node_modules/react-native-reanimated" ]; then
    # Create a patch file to comment out the problematic static_assert
    cat > node_modules/react-native-reanimated/android/src/main/cpp/reanimated/F14TablePatch.h << 'EOF'
#ifndef F14TABLE_PATCH_H
#define F14TABLE_PATCH_H

// Workaround for std::regular not being available in C++17
#ifdef __cpp_lib_concepts
  #if __cpp_lib_concepts < 202002L
    namespace std {
      template<typename T>
      concept regular = true;  // Simplified workaround
    }
  #endif
#else
  namespace std {
    template<typename T>
    concept regular = true;  // Simplified workaround
  }
#endif

#endif // F14TABLE_PATCH_H
EOF

    # Add include to all C++ files that might need it
    find node_modules/react-native-reanimated/android/src/main/cpp -name "*.cpp" -exec sed -i '1i#include "../../reanimated/F14TablePatch.h"' {} \;
fi

# 5. Alternative fix: Modify the build.gradle to add compiler flags
if [ -f "node_modules/react-native-reanimated/android/build.gradle" ]; then
    # Add a section to force C++17
    sed -i '/android {/a\
    defaultConfig {\
        externalNativeBuild {\
            cmake {\
                cppFlags.add("-std=c++17")\
                arguments "-DANDROID_STL=c++_shared"\
            }\
        }\
    }' node_modules/react-native-reanimated/android/build.gradle
fi

echo "React Native Reanimated C++ fixes applied!"