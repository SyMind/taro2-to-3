'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component',
  'function-component'
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