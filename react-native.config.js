module.exports = {
  project: {
    ios: {},
    android: {
      sourceDir: './GreedGross',
      manifestPath: 'app/src/main/AndroidManifest.xml',
      packageName: 'com.greedandgross.cannabisbreeding',
      buildGradlePath: 'build.gradle',
      appName: 'app',
    },
  },
  dependencies: {
    // Ensure all native modules are autolinked
    'react-native-reanimated': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-reanimated/android',
        },
      },
    },
  },
};