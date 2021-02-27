'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
    'basic-default',
    'basic-default-export-jsx-element',
    'default-and-multiple-specifiers-import',
    'leading-comment'
];

tests.forEach(test => {
    defineTest(
        __dirname,
        'update-imports',
        null,
        `update-imports/${test}`
    );
});
