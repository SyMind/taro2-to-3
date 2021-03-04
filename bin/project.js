const path = require('path');
const fs = require('graceful-fs');
const {merge} = require('lodash');
const {TARO_ENVS, PROJECT_CONFIG_DIR} = require('./constants');
const {resolveScriptPath} = require('./utils');
const Entry = require('./entry');

class Project {
  constructor(dir) {
    this.dir = dir;
    this.configFilePath = path.join(this.dir, `${PROJECT_CONFIG_DIR}/index.js`);

    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`We cannot found your taro config file: ${this.configFilePath}`);
    }

    this.config = require(this.configFilePath)(merge);

    this.entryFiles = Object.keys(TARO_ENVS)
      .map(key => {
        const env = TARO_ENVS[key];
        return resolveScriptPath(path.join(this.sourceRoot, 'app'), env);
      });

    this.entries = [...new Set(this.entryFiles)]
      .map(f => path.join(dir, f))
      .map(p => new Entry(p));

    this.pages = this.entries
      .map(e => e.pages)
      .reduce((r, ps) => r.concat(ps), [])
      .map(p => `${this.sourceRoot}/${p}`);
  }

  get sourceRoot() {
    return this.config.sourceRoot;
  }
}

module.exports = Project;
