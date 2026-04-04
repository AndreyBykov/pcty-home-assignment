import playwrightPlugin from 'eslint-plugin-playwright';
import stylisticPlugin from '@stylistic/eslint-plugin';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';

import typescriptParser from '@typescript-eslint/parser';

export default [{
    files: ['**/*.ts'],
    plugins: {
        '@typescript-eslint': typescriptPlugin,
        'playwright': playwrightPlugin,
        '@stylistic': stylisticPlugin,
    },
    languageOptions: {
        parser: typescriptParser,
        parserOptions: {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
            ecmaVersion: 'latest',
            sourceType: 'module'
        }
    },
    rules: {
        ...typescriptPlugin.configs['strict-type-checked'].rules,
        ...typescriptPlugin.configs['stylistic-type-checked'].rules,
        ...playwrightPlugin.configs['flat/recommended'].rules,
        'no-console': 'off',
        'no-shadow': 'error',

        'playwright/no-useless-not': 'error',
        'playwright/no-skipped-test': 'warn',
        'playwright/expect-expect': 'off',
        'playwright/no-networkidle': 'off',
        'playwright/no-conditional-expect': 'off',
        'playwright/no-conditional-in-test': 'off',

        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',

        '@stylistic/indent': ['error', 4],
        '@stylistic/quotes': ['error', 'single', {
            'avoidEscape': true,
        }],
        '@stylistic/semi': ['error', 'always'],
        '@stylistic/array-element-newline': ['error', 'consistent'],
        '@stylistic/array-bracket-newline': ['error', 'consistent'],
        '@stylistic/object-curly-spacing': ['error', 'always'],
        '@stylistic/comma-dangle': ['error', 'always-multiline'],
        '@stylistic/max-len': ['error', {
            'code': 160,
            'ignoreStrings': true,
            'ignoreUrls': true,
            'ignoreTemplateLiterals': true,
            'ignoreRegExpLiterals': true,
            'ignoreComments': true,
        }],
        '@stylistic/function-call-argument-newline': ['error', 'consistent'],
        '@stylistic/function-paren-newline': ['error', 'consistent'],
    }
}];
