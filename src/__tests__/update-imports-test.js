'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
    'default-import',
    'default-export-jsx-element',
    'multiple-specifiers-import',
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
