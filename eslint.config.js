import { julr } from '@julr/tooling-configs/eslint'

export default await julr({
  rules: {
    '@typescript-eslint/no-unused-expressions': 'off',
    'jsonc/no-useless-escape': 'off',
    'import/no-mutable-exports': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
  },
})
