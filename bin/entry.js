const fs = require('graceful-fs');
const jscodeshift = require('jscodeshift');

class Entry {
  constructor(entryFilePath) {
    const code = fs.readFileSync(entryFilePath).toString();
    const j = jscodeshift.withParser('babylon');
    const root = j(code);
    const TaroUtils = require('../transforms/TaroUtils')(j);

    const taroClassComponents = TaroUtils.findTaroES6ClassDeclaration(root);
    if (taroClassComponents.size() === 0) {
      return;
    }

    const entryComponent = taroClassComponents.at(0);
    const properties = entryComponent.find(j.ClassProperty, {
      type: 'ClassProperty',
      key: {
        type: 'Identifier',
        name: 'config'
      },
      value: {
        type: 'ObjectExpression'
      }
    });
    if (properties.size() === 0) {
      return;
    }
    const configPath = properties.paths()[0];

    this.pages = [];

    const mainPkgPagesPath = configPath.value.value.properties.find(x =>
      x.type === 'ObjectProperty' &&
      x.key.type === 'Identifier' &&
      x.key.name === 'pages' &&
      x.value.type === 'ArrayExpression'
    );
    if (mainPkgPagesPath) {
      const mainPkgPages = mainPkgPagesPath.value.elements.map(x => x.value);
      this.pages = this.pages.concat(mainPkgPages);
    }

    const subPkgsPath = configPath.value.value.properties.find(x =>
      x.type === 'ObjectProperty' &&
      x.key.type === 'Identifier' &&
      x.key.name === 'subPackages' &&
      x.value.type === 'ArrayExpression'
    );
    if (subPkgsPath) {
      const subPkgPages = subPkgsPath.value.elements
        .filter(path => path.type === 'ObjectExpression')
        .reduce((arr, path) => {
          const rootPath = path.properties.find(p => p.key.name === 'root');
          const pagesPath = path.properties.find(p => p.key.name === 'pages');
          if (rootPath && pagesPath) {
            const root = rootPath.value.value;
            return arr.concat(
              pagesPath.value.elements.map(e => `${root}/${e.value}`.replace(/\/{2,}/g, '/'))
            );
          }
          return arr;
        }, []);
      this.pages = this.pages.concat(subPkgPages);
    }
  }

  toSource() {
    // TODO
  }
}

module.exports = Entry;
