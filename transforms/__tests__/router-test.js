'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component',
  'function-component',
  'class-component-updated-by-taro-imports',
  'function-component-updated-by-taro-imports',
  'function-component-with-mltiplue-use-router',
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
