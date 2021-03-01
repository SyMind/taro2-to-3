'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/dist/testUtils').defineTest;

const tests = [
    'class-component'
];

tests.forEach(test => {
    defineTest(
        __dirname,
        'router',
        null,
        `router/${test}`
    );
});
