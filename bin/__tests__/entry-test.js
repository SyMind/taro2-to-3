const path = require('path');
const Entry = require('../entry');

describe('Entry', () => {
  it('basic', () => {
    const entryFile = path.resolve(__dirname, '../__testfixtures__/entry/basic.js');
    const entry = new Entry(entryFile);
    expect(entry.entryComponent).toBeTruthy();
    expect(entry.pages).toEqual(['pages/home/home']);
  });
});
