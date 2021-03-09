'use strict';

jest.autoMockOff();
const {defineTest, runInlineTest} = require('jscodeshift/dist/testUtils');
const path = require('path');
const fs = require('fs');

const tests = [
  'class-component',
  'class-component-with-config-property',
  'class-component-with-config-assignment',
  'class-component-export-default-identifier',
  'function-component',
  'function-component-with-config-assignment',
  'arrow-function-component-with-config-assignment',
  'merge-default-config'
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

const pageConfigTests = [
  'merge-h5-config.input.h5.js',
  'merge-swan-config.input.swan.js'
];

pageConfigTests.forEach(test => {
  it(test, () => {
    const transform = require(path.join(__dirname, '..', 'page-config'));
    const fixtureDir = path.join(__dirname, '..', '__testfixtures__');
    const inputPath = path.join(fixtureDir, 'page-config', test);
    const source = fs.readFileSync(inputPath, 'utf8');
    const expectedOutput = fs.readFileSync(
      path.join(fixtureDir, 'page-config', test.replace('input', 'output')),
      'utf8'
    );
    runInlineTest(
      transform,
      {
        quote: 'single',
        pages: `page-config/${test.split('.').slice(0, -1).join('.')}`
      },
      {
        path: inputPath,
        source
      },
      expectedOutput
    );
  });
});
