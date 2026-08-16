const nx = require('@nx/eslint-plugin')
const unusedImports = require('eslint-plugin-unused-imports')
const jsoncParser = require('jsonc-eslint-parser')

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  ...nx.configs['flat/react'],
  {
    ignores: [
      '**/dist',
      '**/coverage',
      '**/.nx',
      '**/.vite',
      '**/*.timestamp*',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      'app/src/dm/**',
    ],
  },
  {
    plugins: {
      'unused-imports': unusedImports,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^\\.\\.?/', '^@zenless-optimizer/pando/engine'],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-extra-semi': 'off',
      'array-callback-return': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-new-func': 'off',
      'no-dupe-keys': 'off',
      'no-useless-concat': 'off',
      'no-sequences': 'off',
      eqeqeq: 'off',
      'no-mixed-operators': 'off',
      'no-throw-literal': 'off',
      'no-loop-func': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        jest: true,
      },
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
  },
  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['packages/game-opt/engine/**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/vite.config.{js,ts,mjs,mts}'],
        },
      ],
    },
  },
  {
    files: ['packages/common/plugin/**/*.json'],
    rules: {
      '@nx/nx-plugin-checks': 'error',
    },
  },
]
