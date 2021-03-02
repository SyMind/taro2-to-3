module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 8
  },
  extends: 'eslint:recommended',
  ignorePatterns: ['**/__testfixtures__/**/*.js'],
  rules: {
    'comma-dangle': 2,
    'quotes': [2, 'single'],
    'indent': [2, 2],
    'semi': [2, 'always']
  }
};
