'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component',
  'class-component-with-config-property',
  'class-component-with-config-assignment',
  'class-component-export-default-identifier',
  'function-component',
  'function-component-with-config-assignment',
  'arrow-function-component-with-config-assignment'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'page-config',
    {
      quote: 'single',
      pages: tests.map(t => `page-config/${t}.input`).join(',')
    },
    `page-config/${test}`
  );
});
