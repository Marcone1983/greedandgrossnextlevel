#!/bin/bash

# Find all files with console statements and update them
echo "Finding and updating remaining console statements..."

# Get all files with console statements (excluding errorLogger.ts and scripts)
files=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "console\.\(log\|error\|warn\|debug\)" {} \; | grep -v "errorLogger.ts")

for file in $files; do
    echo "Processing: $file"
    
    # Check if file already has errorLogger import
    if ! grep -q "import { errorLogger }" "$file"; then
        # Add import at the beginning of the file
        # Check if it's a service file (needs relative import)
        if [[ "$file" == *"src/services/"* ]]; then
            sed -i "1i import { errorLogger } from './errorLogger';" "$file"
        else
            sed -i "1i import { errorLogger } from '@/services/errorLogger';" "$file"
        fi
    fi
    
    # Replace console.log
    sed -i "s/console\.log(\(.*\));/errorLogger.info('Log', '${file##*/}', { message: \1 });/g" "$file"
    
    # Replace console.error with proper context
    sed -i "s/console\.error('\([^']*\)'[[:space:]]*,[[:space:]]*\(.*\));/errorLogger.error('\1', \2, '${file##*/}');/g" "$file"
    sed -i "s/console\.error('\([^']*\)');/errorLogger.error('\1', undefined, '${file##*/}');/g" "$file"
    sed -i "s/console\.error(\(.*\));/errorLogger.error('Error', \1, '${file##*/}');/g" "$file"
    
    # Replace console.warn
    sed -i "s/console\.warn('\([^']*\)'[[:space:]]*,[[:space:]]*\(.*\));/errorLogger.warn('\1', '${file##*/}', { details: \2 });/g" "$file"
    sed -i "s/console\.warn('\([^']*\)');/errorLogger.warn('\1', '${file##*/}');/g" "$file"
    sed -i "s/console\.warn(\(.*\));/errorLogger.warn('Warning', '${file##*/}', { message: \1 });/g" "$file"
    
    # Replace console.debug
    sed -i "s/console\.debug(\(.*\));/errorLogger.debug('Debug', '${file##*/}', { message: \1 });/g" "$file"
done

echo "Done! Updated ${#files[@]} files."