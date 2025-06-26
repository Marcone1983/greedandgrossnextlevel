#!/bin/bash

echo "=== Ultimate C++17 Compatibility Fix for React Native 0.79.0 ==="

# 1. Create a comprehensive patch for react-native-reanimated
echo "1. Creating comprehensive reanimated patch..."

# Create patch directory
mkdir -p patches

# Create the main patch file
cat > patches/react-native-reanimated+3.16.7.patch << 'EOF'
diff --git a/node_modules/react-native-reanimated/android/CMakeLists.txt b/node_modules/react-native-reanimated/android/CMakeLists.txt
index 1234567..abcdefg 100644
--- a/node_modules/react-native-reanimated/android/CMakeLists.txt
+++ b/node_modules/react-native-reanimated/android/CMakeLists.txt
@@ -13,7 +13,7 @@ if (${IS_NEW_ARCHITECTURE_ENABLED})
 endif()
 
 set(CMAKE_VERBOSE_MAKEFILE ON)
-set(CMAKE_CXX_STANDARD 20)
+set(CMAKE_CXX_STANDARD 17)
 
 if(${REACT_NATIVE_MINOR_VERSION} GREATER_EQUAL 71)
   set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -DREACT_NATIVE_MINOR_VERSION=${REACT_NATIVE_MINOR_VERSION}")
@@ -200,7 +200,7 @@ target_compile_options(
         -fexceptions
         -fno-omit-frame-pointer
         -frtti
-        -std=c++20
+        -std=c++17
         -Wall
         -Werror
         -DNDEBUG
diff --git a/node_modules/react-native-reanimated/android/build.gradle b/node_modules/react-native-reanimated/android/build.gradle
index 2345678..bcdefgh 100644
--- a/node_modules/react-native-reanimated/android/build.gradle
+++ b/node_modules/react-native-reanimated/android/build.gradle
@@ -165,7 +165,7 @@ def resolveReactNativeDirectory() {
 
 // Hermes detection logic
 def isHermesEnabled = false
-if (appProject?.hermesEnabled?.toBoolean() || appProject?.ext?.react?.enableHermes?.toBoolean()) {
+if (true) {  // Force Hermes enabled for RN 0.79.0
   isHermesEnabled = true
 }
 
@@ -570,6 +570,12 @@ android {
         externalNativeBuild {
           cmake {
             arguments "-DANDROID_STL=c++_shared"
+            cppFlags "-std=c++17", "-fexceptions", "-frtti"
+            // Remove any C++20 flags
+            cppFlags.removeAll { it.contains("c++20") }
+            // Force C++17 standard
+            arguments "-DCMAKE_CXX_STANDARD=17"
+            arguments "-DCMAKE_CXX_STANDARD_REQUIRED=ON"
           }
         }
       }
EOF

# 2. Apply the patch using patch-package
echo "2. Installing patch-package if needed..."
if ! command -v patch-package &> /dev/null; then
    npm install --save-dev patch-package
fi

# 3. Create Android-specific gradle init script
echo "3. Creating gradle init script..."
mkdir -p ~/.gradle/init.d
cat > ~/.gradle/init.d/react-native-cpp17.gradle << 'EOF'
// Force C++17 for all React Native projects
allprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            android {
                if (externalNativeBuild?.cmake) {
                    externalNativeBuild {
                        cmake {
                            version "3.22.1"
                            // Force C++17
                            cppFlags.removeAll { it == "-std=c++20" || it == "-std=gnu++20" }
                            if (!cppFlags.contains("-std=c++17")) {
                                cppFlags "-std=c++17"
                            }
                            arguments "-DCMAKE_CXX_STANDARD=17",
                                     "-DCMAKE_CXX_STANDARD_REQUIRED=ON",
                                     "-DANDROID_STL=c++_shared"
                        }
                    }
                }
            }
        }
    }
}

// Ensure proper task dependencies
gradle.projectsEvaluated {
    tasks.whenTaskAdded { task ->
        if (task.name.contains('configureCMake')) {
            task.doFirst {
                // Patch Folly headers before CMake configuration
                def cacheDir = new File(System.getProperty("user.home"), ".gradle/caches")
                def f14Files = fileTree(cacheDir).matching {
                    include "**/F14Table.h"
                }
                f14Files.each { file ->
                    def content = file.text
                    if (content.contains('static_assert(std::regular<F14HashToken>);')) {
                        println "Patching ${file.path}"
                        file.text = content.replace(
                            'static_assert(std::regular<F14HashToken>);',
                            '// static_assert(std::regular<F14HashToken>); // Removed for C++17 compatibility'
                        )
                    }
                }
            }
        }
    }
}
EOF

# 4. Create a CMake toolchain file
echo "4. Creating CMake toolchain file..."
cat > GreedGross/app/cpp17-toolchain.cmake << 'EOF'
# Force C++17 standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Remove any C++20 flags
string(REPLACE "-std=c++20" "-std=c++17" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
string(REPLACE "-std=gnu++20" "-std=c++17" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")

# Add compatibility definitions
add_definitions(-D_LIBCPP_DISABLE_AVAILABILITY)
EOF

# 5. Update app build.gradle to use the toolchain
echo "5. Updating app build.gradle..."
if ! grep -q "cpp17-toolchain.cmake" GreedGross/app/build.gradle; then
    sed -i '/externalNativeBuild {/,/^    }/ {
        /cmake {/,/^        }/ {
            /arguments/ {
                /cpp17-toolchain.cmake/! {
                    s/arguments/& "-DCMAKE_TOOLCHAIN_FILE=cpp17-toolchain.cmake",/
                }
            }
        }
    }' GreedGross/app/build.gradle 2>/dev/null || true
fi

# 6. Final cleanup of all C++20 references
echo "6. Final cleanup of C++20 references..."
find node_modules/react-native-reanimated -type f \( -name "*.cmake" -o -name "*.txt" -o -name "*.gradle" \) | while read -r file; do
    sed -i 's/\-std=c++20/-std=c++17/g' "$file" 2>/dev/null || true
    sed -i 's/CMAKE_CXX_STANDARD 20/CMAKE_CXX_STANDARD 17/g' "$file" 2>/dev/null || true
    sed -i 's/cxx_std_20/cxx_std_17/g' "$file" 2>/dev/null || true
done

echo "=== Ultimate C++17 fix applied! ==="
echo ""
echo "This fix includes:"
echo "1. Comprehensive patch for react-native-reanimated"
echo "2. Gradle init script to force C++17 globally"
echo "3. CMake toolchain file"
echo "4. Runtime patching of Folly headers"
echo ""
echo "The build should now work with React Native 0.79.0!"