import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import perfectionist from 'eslint-plugin-perfectionist'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  globalIgnores(['dist']),
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  perfectionist.configs['recommended-natural'],
  stylistic.configs.customize({
    arrowParens: 'always',
    flat: true,
  }),
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/operator-linebreak': ['error', 'after'],
    },
  },
)
