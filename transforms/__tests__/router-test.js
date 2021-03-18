'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component',
  'function-component',
  'class-component-updated-by-taro-imports',
  'class-component-with-default-taro-import',
  'function-component-updated-by-taro-imports',
  'function-component-with-mltiplue-use-router',
  'function-component-with-taro-default-import',
  'allready'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'router',
    {
      quote: 'single'
    },
    `router/${test}`
  );
});
