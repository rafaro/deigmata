// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // we only want single quotes
    quotes: ['error', 'single'],
    // we want to force semicolons
    semi: ['error', 'always'],
    //semicolon: [true, 'always', 'ignore-bound-class-methods'],
    // we use 2 spaces to indent our code
     indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        ignoredNodes: ['ConditionalExpression'], 
      },
    ],
    // we want to avoid useless spaces
    'no-multi-spaces': ['error'],
    'keyword-spacing': 2,
      // '@typescript-eslint/no-explicit-any': 'off',
      // '@typescript-eslint/no-floating-promises': 'warn',
      // '@typescript-eslint/no-unsafe-argument': 'warn'
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto"
      }
    ]
    },
  }
);