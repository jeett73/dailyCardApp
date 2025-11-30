const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'web-build/*', '.expo/*', 'node_modules/*', 'android/*', 'ios/*'],
    rules: {
      'prettier/prettier': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-unused-vars': ['warn'],
      'no-console': ['warn'],
      'no-debugger': ['error'],
      'consistent-return': ['error'],
      'no-duplicate-imports': ['error'],
      'prefer-const': ['error'],
      'no-var': ['error'],
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.*'],
    languageOptions: {
      globals: { ...globals.jest },
    },
    rules: {
      'no-undef': 'off',
    },
  },
  // Disable any ESLint rules that might conflict with Prettier
  eslintConfigPrettier,
]);
