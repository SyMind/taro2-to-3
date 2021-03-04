'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'class-component-with-config-property',
  'class-component'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'page-config',
    {
      quote: 'single',
      pages: [
        'page-config/class-component-with-config-property.input',
        'page-config/class-component.input'
      ].join(',')
    },
    `page-config/${test}`
  );
});
