module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@hooks': './src/hooks',
            '@constants': './src/constants',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
      [
        'module:react-native-dotenv',
        {
          envName: 'APP_ENV',
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
    ],
  };
};
