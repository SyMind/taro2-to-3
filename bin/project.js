const path = require('path');
const fs = require('graceful-fs');
const {merge} = require('lodash');
const jscodeshift = require('jscodeshift');
const {TARO_ENVS, PROJECT_CONFIG_DIR} = require('./constants');
const {resolveScriptPath} = require('./utils');
const Entry = require('./entry');

const j = jscodeshift.withParser('babylon');

class Project {
  constructor(dir) {
    this.dir = dir;
    this.configFilePath = path.join(this.dir, `${PROJECT_CONFIG_DIR}/index.js`);

    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`We cannot found your taro config file: ${this.configFilePath}`);
    }

    this.config = require(this.configFilePath)(merge);

    this.entryFiles = [...new Set(
      Object.keys(TARO_ENVS)
        .map(key => {
          const env = TARO_ENVS[key];
          return resolveScriptPath(path.join(this.sourceRoot, 'app'), env);
        })
    )];

    this.entries = this.entryFiles
      .map(f => path.join(dir, f))
      .map(p => new Entry(p));

    this.pages = this.entries
      .map(e => e.pages)
      .reduce((r, ps) => r.concat(ps), [])
      .map(p => p[0] === '/'
        ? `${this.sourceRoot}${p}`
        : `${this.sourceRoot}/${p}`
      );
  }

  get sourceRoot() {
    return this.config.sourceRoot;
  }

  transformConfig() {
    const source = fs.readFileSync(this.configFilePath, 'utf-8');
    const root = j(source);

    const projectNameObjProp = root.find(j.ObjectProperty, {
      type: 'ObjectProperty',
      key: {
        type: 'Identifier',
        name: 'projectName'
      }
    });
    if (projectNameObjProp.size() !== 0) {
      projectNameObjProp.insertBefore(
        j.objectProperty(
          j.identifier('framework'),
          j.stringLiteral('react')
        )
      );
    }

    const babelObjProp = root.find(j.ObjectProperty, {
      type: 'ObjectProperty',
      key: {
        type: 'Identifier',
        name: 'babel'
      }
    });
    if (babelObjProp.size() !== 0) {
      babelObjProp.remove();
    }

    const sassLoaderOptionObjProp = root.find(j.ObjectProperty, {
      type: 'ObjectProperty',
      key: {
        type: 'Identifier',
        name: 'sassLoaderOption'
      }
    });
    if (babelObjProp.size() !== 0) {
      sassLoaderOptionObjProp.paths()[0].value.key.name = 'prependData';
    }

    fs.writeFileSync(this.configFilePath, root.toSource());
  }

  transformEntry() {
    for (let i = 0; i < this.entries.length; i++) {
      const file = this.entryFiles[i];
      const entry = this.entries[i];
      fs.writeFileSync(file, entry.transform());
    }
  }
}

module.exports = Project;
