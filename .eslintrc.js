module.exports = {
   root: true,
   plugins: ['@typescript-eslint'],
   parserOptions: {
      project: './tsconfig.json',
   },
   extends: ['standard-with-typescript'],
   rules: {
      indent: 'off',
      '@typescript-eslint/indent': 'off',
      'comma-dangle': 0,
      semi: 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/semi': 0,
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/member-delimiter-style': [
         'error',
         {
            multiline: {
               delimiter: 'semi', // 'none' or 'semi' or 'comma'
               requireLast: true,
            },
            singleline: {
               delimiter: 'semi', // 'semi' or 'comma'
               requireLast: false,
            },
         },
      ],
      yoda: 0,
      // note you must disable the base rule as it can report incorrect errors
      'no-return-await': 'off',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
   },
};
