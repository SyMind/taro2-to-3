const fs = require('fs');
const path = require('path');
const {SECIPT_EXTS} = require('./constants');

function resolveScriptPath(p, env) {
  const realPath = p;
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
  return realPath;
}

module.exports = {
  resolveScriptPath
};
