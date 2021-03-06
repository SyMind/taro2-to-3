'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component-with-config-property',
  'class-component-with-config-assignment',
  'class-component',
  'class-component-export-default-identifier'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'page-config',
    {
      quote: 'single',
      pages: [
        'page-config/class-component-with-config-property.input',
        'page-config/class-component-with-config-assignment.input',
        'page-config/class-component.input',
        'page-config/class-component-export-default-identifier.input'
      ].join(',')
    },
    `page-config/${test}`
  );
});
