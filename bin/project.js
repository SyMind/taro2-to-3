const path = require('path');
const fs = require('fs-extra');
const {merge} = require('lodash');
const jscodeshift = require('jscodeshift');
const slash = require('slash');
const {createBabelRegister} = require('@tarojs/helper');
const {TARO_ENVS, PROJECT_CONFIG_DIR} = require('./constants');
const {resolveScriptPath, getDefaultExport} = require('./utils');
const {deprecated} = require('./taroDeps');
const Entry = require('./entry');

const j = jscodeshift.withParser('babylon');

const getType = obj => obj === null ? 'null' : typeof obj;

function transformConfig(source) {
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
  if (babelObjProp.size() > 0) {
    babelObjProp.remove();
  }

  const sassLoaderOptionObjProp = root.find(j.ObjectProperty, {
    type: 'ObjectProperty',
    key: {
      type: 'Identifier',
      name: 'sassLoaderOption'
    }
  });
  if (sassLoaderOptionObjProp.size() > 0) {
    const props = sassLoaderOptionObjProp.paths()[0].value.value.properties;
    const dataProp = props.find(p => (
      p.type === 'ObjectProperty' &&
      p.key.type === 'Identifier' &&
      p.key.name === 'data'
    ));
    if (dataProp) {
      dataProp.key.name = 'prependData';
    }
  }

  const pluginsArrProp = root.find(j.ObjectProperty, {
    type: 'ObjectProperty',
    key: {
      type: 'Identifier',
      name: 'plugins'
    },
    value: {
      type: 'ArrayExpression'
    }
  });
  if (pluginsArrProp.size() > 0) {
    const elements = pluginsArrProp.paths()[0].value.value.elements;
    const validElements = elements.filter(e => (
      e.type === 'StringLiteral' &&
      deprecated.indexOf(e.value) === -1
    ));
    pluginsArrProp.paths()[0].value.value.elements = validElements;
  }

  return root.toSource();
}

class Project {
  constructor(dir) {
    this.configFilePath = path.join(dir, `${PROJECT_CONFIG_DIR}/index.js`);

    if (!fs.existsSync(this.configFilePath)) {
      throw new Error(`Can't found your taro config file: ${slash(this.configFilePath)}.`);
    }

    createBabelRegister({
      only: [filePath => filePath.indexOf(path.join(dir, PROJECT_CONFIG_DIR)) >= 0]
    });
    this.config = getDefaultExport(require(this.configFilePath)(merge));

    if (typeof this.config !== 'object' || this.config === null) {
      throw new Error(`Taro config file should return an object type value, now is ${getType(this.config)}.`);
    }

    this.sourceRoot = this.config.sourceRoot;
    if (typeof this.sourceRoot !== 'string') {
      throw new Error(`Taro sourceRoot in config should an string type value, now is ${getType(this.sourceRoot)}.`);
    }

    this.entryFiles = [...new Set(
      Object.keys(TARO_ENVS)
        .map(key => {
          const env = TARO_ENVS[key];
          return resolveScriptPath(path.join(dir, this.sourceRoot, 'app'), env);
        })
        .filter(p => !!p)
    )];

    if (this.entryFiles.length === 0) {
      throw new Error(`Can't found your taro entry file, like: ${slash(path.join(this.sourceRoot, 'app.js'))}.`);
    }

    this.entries = this.entryFiles.map(p => new Entry(p));

    this.pages = this.entries
      .map(e => e.pages)
      .reduce((r, ps) => r.concat(ps), [])
      .map(p => p[0] === '/'
        ? `${this.sourceRoot}${p}`
        : `${this.sourceRoot}/${p}`
      );
  }

  transformAndOverwriteConfig() {
    const source = fs.readFileSync(this.configFilePath, 'utf-8');
    const transformedSource = transformConfig(source);
    fs.writeFileSync(this.configFilePath, transformedSource);
  }

  transformEntry() {
    for (let i = 0; i < this.entries.length; i++) {
      const file = this.entryFiles[i];
      const entry = this.entries[i];
      const source = entry.transform();
      if (source) {
        fs.writeFileSync(file, source);
      }
    }
  }
}

Project.transformConfig = transformConfig;

module.exports = Project;
