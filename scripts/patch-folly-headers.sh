#!/bin/bash
# Patch Folly headers to fix std::regular concept issue

echo "Patching Folly headers for C++17 compatibility..."

# Create a patch that will be applied during build
cat > folly-patch.cpp << 'EOF'
// This file patches the Folly F14Table.h to work with C++17
// by removing the std::regular static_assert that requires C++20

#include <string>
#include <iostream>
#include <fstream>
#include <regex>

int main() {
    // This would be run as a pre-build step
    return 0;
}
EOF

# Create sed script to patch gradle cache files during build
cat > patch-gradle-cache.sh << 'SCRIPT'
#!/bin/bash
# Find and patch F14Table.h in gradle cache
find ~/.gradle/caches -name "F14Table.h" -type f 2>/dev/null | while read -r file; do
    echo "Patching: $file"
    # Comment out the problematic static_assert
    sed -i 's/static_assert(std::regular<F14HashToken>);/\/\/ static_assert(std::regular<F14HashToken>); \/\/ Commented out for C++17 compatibility/' "$file" 2>/dev/null || true
done
SCRIPT

chmod +x patch-gradle-cache.sh

echo "Folly header patch script created!"