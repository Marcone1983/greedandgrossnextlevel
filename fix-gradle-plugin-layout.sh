#!/bin/bash
set -e

echo "🔧 Fixing React Native Gradle Plugin layout issue..."

# Fix the ReactSettingsExtension.kt file
EXTENSION_FILE="node_modules/@react-native/gradle-plugin/settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsExtension.kt"

if [ -f "$EXTENSION_FILE" ]; then
  echo "Patching ReactSettingsExtension.kt..."
  
  # Create a fixed version of the file
  cat > "$EXTENSION_FILE" << 'EOF'
/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import java.io.File
import javax.inject.Inject
import org.gradle.api.Project
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.ProjectLayout
import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.Property

abstract class ReactSettingsExtension @Inject constructor(
    private val objects: ObjectFactory,
    private val layout: ProjectLayout
) {

  private val defaultAndroidDir = layout.projectDirectory.dir("../android")
  private val defaultLockFile = layout.projectDirectory.file("../yarn.lock")

  /**
   * Utility function to find a file in the directory hierarchy starting from the given directory.
   * @param file The file/directory to look for
   * @param startDir The starting directory to look from
   * @return The absolute path to the @param file if found, null otherwise
   */
  internal fun findFileInDirectory(file: String, startDir: File): File? {
    var currentDir: File? = startDir
    while (currentDir != null) {
      val candidateFile = File(currentDir, file)
      if (candidateFile.exists()) {
        return candidateFile
      }
      currentDir = currentDir.parentFile
    }
    return null
  }

  /**
   * Utility function to silence the "IncorrectConfigurationName" warning for Kotlin DSL that will
   * be fixed in Gradle 9.x. See https://github.com/gradle/gradle/issues/27708
   */
  @Suppress("IncorrectConfigurationName")
  internal val DirectoryProperty.androidDir: File
    get() = asFile.get()

  /**
   * Utility function to silence the "IncorrectConfigurationName" warning for Kotlin DSL that will
   * be fixed in Gradle 9.x. See https://github.com/gradle/gradle/issues/27708
   */
  @Suppress("IncorrectConfigurationName")
  internal val ConfigurableFileCollection.lockFiles: Set<File>
    get() = asFileTree.files

  /**
   * The path to the Android folder of the project. By default is `../android` if a
   * `settings.gradle(.kts)` file is found there. Otherwise is `../../android` if that folder
   * exists and is a sibling of the React Native root.
   */
  abstract val androidDir: DirectoryProperty

  /**
   * The path to the lock file to use. This is used by autolinking to determine if the dependencies
   * have changed and autolinking should re-run. It defaults to `../yarn.lock` or `../package-lock.json`
   * if found. If not found, it will default to `../yarn.lock`.
   */
  abstract val lockFiles: ConfigurableFileCollection

  /**
   * Whether to automatically include Native Modules found in your `node_modules` folder.
   * Defaults to `true`.
   */
  abstract val autolinkLibrariesWithApp: Property<Boolean>

  internal fun applyDefaults(project: Project) {
    androidDir.convention(defaultAndroidDir)
    
    // Determine the default lock file
    val defaultLockFiles = layout.projectDirectory.files(
        "../yarn.lock",
        "../package-lock.json",
        "../pnpm-lock.yaml",
        "../bun.lockb"
    )
    
    lockFiles.convention(defaultLockFiles)
    autolinkLibrariesWithApp.convention(true)
  }
}
EOF

  echo "✅ ReactSettingsExtension.kt patched successfully!"
  
  # Also fix the ReactSettingsPlugin.kt if needed
  PLUGIN_FILE="node_modules/@react-native/gradle-plugin/settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsPlugin.kt"
  
  if [ -f "$PLUGIN_FILE" ]; then
    echo "Checking ReactSettingsPlugin.kt..."
    # Make sure the extension is created properly
    sed -i 's/extensions.create("react", ReactSettingsExtension::class.java)/extensions.create("react", ReactSettingsExtension::class.java, objects, layout)/' "$PLUGIN_FILE" 2>/dev/null || true
  fi
  
else
  echo "⚠️  ReactSettingsExtension.kt not found, skipping patch"
fi

echo "✅ Gradle plugin fix completed!"