import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import eslintPluginVue from 'eslint-plugin-vue';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      'public/**',
      // <script> を含む .astro は astro-eslint-parser がパースに失敗するため除外。
      // Prettier 側 (`prettier --check`) でフォーマットチェックは確保している。
      'src/features/navigation/components/Header.astro',
      'src/layouts/Layout.astro',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript support
  ...tseslint.configs.recommended,

  // Astro support
  ...eslintPluginAstro.configs.recommended,

  // Vue support with TypeScript parser (Flat config形式)
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Slidevコンポーネントはanyを使用することがある
      '@typescript-eslint/no-explicit-any': 'warn',
      // Slidevコンポーネント名は単一単語でも許可
      'vue/multi-word-component-names': 'off',
    },
  },

  // Node.js scripts (console等のグローバル変数を許可)
  {
    files: ['scripts/**/*.mjs', '*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // 小説変換スクリプト等のコメントで全角スペース（セクション区切り記号の説明）を使うため許可。
      // 文字列リテラル内の全角スペースは skipStrings(デフォルト true) で元から許容される。
      'no-irregular-whitespace': ['error', { skipComments: true }],
    },
  },

  // Browser globals (window等を許可)。Slidev コンポーネントは src 側・draft 側のどちらにも展開されるため全 .vue を対象にする
  {
    files: ['**/*.vue'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Prettier integration (must be last to override other formatting rules)
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
);
