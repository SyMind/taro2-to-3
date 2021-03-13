const fs = require('graceful-fs');
const jscodeshift = require('jscodeshift');

const j = jscodeshift.withParser('babylon');

class Entry {
  constructor(entryFilePath) {
    this.root = null;
    this.pages = [];
    this.entryComponent = null;
  
    this.code = fs.readFileSync(entryFilePath).toString();
    this.root = j(this.code);
    const TaroUtils = require('../transforms/TaroUtils')(j);

    const taroClassComponents = TaroUtils.findComponentES6ClassDeclaration(this.root, '@tarojs/taro');
    if (!taroClassComponents || taroClassComponents.size() === 0) {
      return;
    }

    this.entryComponent = taroClassComponents.at(0);
    const properties = this.entryComponent.find(j.ClassProperty, {
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

    this.configPath = properties.paths()[0];
    const mainPkgPagesPath = this.configPath.value.value.properties.find(x =>
      x.type === 'ObjectProperty' &&
      x.key.type === 'Identifier' &&
      x.key.name === 'pages' &&
      x.value.type === 'ArrayExpression'
    );
    if (mainPkgPagesPath) {
      const mainPkgPages = mainPkgPagesPath.value.elements.map(x => x.value);
      this.pages = this.pages.concat(mainPkgPages);
    }

    const subPkgsPath = this.configPath.value.value.properties.find(x =>
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

  transform() {
    if (!this.root || !this.entryComponent || !this.entryComponent.size() === 0) {
      return;
    }

    const exportDefaultPaths = this.root.find(j.ExportDefaultDeclaration, {
      type: 'ExportDefaultDeclaration'
    });

    if (exportDefaultPaths.size() !== 0) {
      return;
    }

    const expressions = this.root.find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: 'Taro'
          },
          property: {
            type: 'Identifier',
            name: 'render'
          }
        }
      }
    });
    expressions.remove();

    const entryComponentName = this.entryComponent.paths()[0].value.id.name;
    this.root.get().node.program.body.push(
      j.exportDefaultDeclaration(
        j.identifier(entryComponentName)
      )
    );

    return this.root.toSource();
  }
}

module.exports = Entry;
