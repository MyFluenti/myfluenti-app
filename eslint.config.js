// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // A fixture é cópia intocada do gerador de referência: não se reformata.
    ignores: ['dist/*', 'src/**/__tests__/fixtures/**'],
  },
]);
