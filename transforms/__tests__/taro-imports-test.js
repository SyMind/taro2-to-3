'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
  'default-import',
  'default-export-jsx-element',
  'named-specifiers-import',
  'default-and-named-specifiers-import',
  'comment',
  'allready'
];

const tsOnlyTests = [
  'named-specifiers-import'
];

tests.forEach(test => {
  defineTest(
    __dirname,
    'taro-imports',
    {
      quote: 'single'
    },
    `taro-imports/${test}`
  );
});

describe('typescript', () => {
  beforeEach(() => {
    jest.mock('../taro-imports', () =>
      Object.assign(
        jest.requireActual('../taro-imports'),
        {
          parser: 'tsx'
        }
      )
    );
  });

  afterEach(() => {
    jest.resetModules();
  });

  tsOnlyTests.forEach((test) => {
    defineTest(
      __dirname,
      'taro-imports',
      {
        quote: 'single'
      },
      `taro-imports/${test}.tsx`
    );
  });
});

