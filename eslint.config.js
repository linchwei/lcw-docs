const eslint = require('@eslint/js')
const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh').default
const eslintPrettier = require('eslint-plugin-prettier')
const importSort = require('eslint-plugin-simple-import-sort')

const tseslint = require('typescript-eslint')

const ignores = [
  'dist',
  'build',
  '**/coverage/**',
  '**/*.js',
  '**/*.mjs',
  '**/*.d.ts',
  'eslint.config.js',
  'commitlint.config.js',
]

const reactRefreshConfig = {
  files: ['apps/web/**/*.{ts,tsx}'],
  ...reactRefresh.configs.vite,
  rules: {
    ...reactRefresh.configs.vite.rules,
    'react-refresh/only-export-components': 'warn',
  },
}

const frontendBuilderConfig = {
  files: ['apps/web/**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-hooks/purity': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/set-state-in-render': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/preserve-manual-memoization': 'warn',
    'no-console': 'warn',
  },
}

const backendBuilderConfig = {
  files: ['apps/server/**/*.ts'],
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.jest,
    },
    parser: tseslint.parser,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'warn',
  },
}

module.exports = tseslint.config(
  {
    ignores,
  },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      prettier: eslintPrettier,
      'simple-import-sort': importSort,
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  frontendBuilderConfig,
  reactRefreshConfig,
  backendBuilderConfig
)
