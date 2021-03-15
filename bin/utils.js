const fs = require('fs-extra');
const path = require('path');
const {SECIPT_EXTS} = require('./constants');

function resolveScriptPath(p, env) {
  for (let i = 0; i < SECIPT_EXTS.length; i++) {
    const ext = SECIPT_EXTS[i];
    if (env) {
      if (fs.existsSync(`${p}.${env}${ext}`)) {
        return `${p}.${env}${ext}`;
      }
      if (fs.existsSync(`${p}${path.sep}index.${env}${ext}`)) {
        return `${p}${path.sep}index.${env}${ext}`;
      }
      if (fs.existsSync(`${p.replace(/\/index$/, `.${env}/index`)}${ext}`)) {
        return `${p.replace(/\/index$/, `.${env}/index`)}${ext}`;
      }
    }
    if (fs.existsSync(`${p}${ext}`)) {
      return `${p}${ext}`;
    }
    if (fs.existsSync(`${p}${path.sep}index${ext}`)) {
      return `${p}${path.sep}index${ext}`;
    }
  }
  return null;
}

const getDefaultExport = module => module.__esModule ? module.default : module;

function unIndent(strings, ...values) {
  const text = strings
    .map((s, i) => (i === 0 ? s : values[i - 1]))
    .join('');
  const lines = text.replace(/^\n/u, '').replace(/\n\s*$/u, '').split('\n');
  const lineIndents = lines.filter(line => line.trim()).map(line => line.match(/ */u)[0].length);
  const minLineIndent = Math.min(...lineIndents);

  return lines.map(line => line.slice(minLineIndent)).join('\n');
}

module.exports = {
  resolveScriptPath,
  getDefaultExport,
  unIndent
};
