'use strict';

jest.autoMockOff();
const {defineTest, runInlineTest} = require('jscodeshift/dist/testUtils');
const path = require('path');
const fs = require('fs-extra');
const marker = require('../utils/marker');

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

  it('mark const enum', async () => {
    const transform = require(path.join(__dirname, '..', 'taro-imports'));
    const fixtureDir = path.join(__dirname, '..', '__testfixtures__');
    const inputPath = path.join(fixtureDir, 'taro-imports/mark-const-enum.tsx.input.js');
    const source = fs.readFileSync(inputPath, 'utf8');
    const expectedOutput = fs.readFileSync(
      path.join(fixtureDir, 'taro-imports/mark-const-enum.tsx.output.js'),
      'utf8'
    );

    await marker.start();
  
    runInlineTest(
      transform,
      {
        quote: 'single'
      },
      {
        path: inputPath,
        source
      },
      expectedOutput
    );

    const dependenciesMarkers = await marker.output();
    expect(dependenciesMarkers).toEqual({
      'babel-plugin-const-enum': 2
    });
  });
});

