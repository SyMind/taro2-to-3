const fs = require('fs');
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

module.exports = {
  resolveScriptPath,
  getDefaultExport
};
