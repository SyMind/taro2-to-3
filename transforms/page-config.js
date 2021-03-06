const path = require('path');
const fs = require('fs');

const getComponentConfigExpressionSelector = pageComponentName => ({
  type: 'AssignmentExpression',
  operator: '=',
  left: {
    type: 'MemberExpression',
    object: {
      type: 'Identifier',
      name: pageComponentName
    },
    property: {
      type: 'Identifier',
      name: 'config'
    }
  },
  right: {
    type: 'ObjectExpression'
  }
});

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const pages = typeof options.pages === 'string'
    ? options.pages.split(',')
    : [];

  const isPage = pages.some(p => file.path.split('.').slice(0, -1).join('.').endsWith(p));

  if (!isPage) {
    return;
  }

  const exportDefaultPaths = root.find(j.ExportDefaultDeclaration, {
    type: 'ExportDefaultDeclaration'
  });

  if (exportDefaultPaths.size() === 0) {
    return;
  }

  let ext = path.extname(file.path);
  if (['.tsx', '.ts'].indexOf(ext) !== -1) {
    ext = '.ts';
  } else {
    ext = '.js';
  }

  const configFilePath = file.path
    .split('.')
    .slice(0, -1)
    .concat(['config', ext].join(''))
    .join('.');

  let source;
  let configFile = j.file(
    j.program([
      j.exportDefaultDeclaration(
        j.objectExpression([])
      )
    ])
  );

  let pageComponent = null;

  let exportDefaultPath = exportDefaultPaths.paths()[0];
  if (exportDefaultPath.value.declaration.type === 'Identifier') {
    const bindings = exportDefaultPath.scope.getBindings()[exportDefaultPath.value.declaration.name];
    if (bindings.length) {
      pageComponent = bindings[0].parentPath.value;
    }
  } else {
    pageComponent = exportDefaultPath.value.declaration;
  }

  if (!pageComponent) {
    return;
  }

  if (
    pageComponent.type === 'ClassDeclaration' &&
    pageComponent.superClass.name === 'Component'
  ) {
    const pageComponentName = pageComponent.id.name;

    const properties = j(pageComponent).find(j.ClassProperty, {
      type: 'ClassProperty',
      key: {
        name: 'config'
      }
    });
    if (properties.size() !== 0) {
      const objectExpression = properties.paths()[0].value.value;
      configFile = j.file(
        j.program([
          j.exportDefaultDeclaration(objectExpression)
        ])
      );

      properties.remove();
      source = root.toSource(options);
    } else {
      const expressions = root.find(
        j.AssignmentExpression,
        getComponentConfigExpressionSelector(pageComponentName)
      );

      if (expressions.size() !== 0) {
        const objectExpression = expressions.paths()[0].value.right;
        configFile = j.file(
          j.program([
            j.exportDefaultDeclaration(objectExpression)
          ])
        );

        expressions.remove();
        source = root.toSource(options);
      }
    }
  } else if (
    pageComponent.type === 'FunctionDeclaration' || (
      pageComponent.type === 'VariableDeclarator' &&
      pageComponent.init.type === 'ArrowFunctionExpression'
    )
  ) {
    const pageComponentName = pageComponent.id.name;
    const expressions = root.find(
      j.AssignmentExpression,
      getComponentConfigExpressionSelector(pageComponentName)
    );

    if (expressions.size() !== 0) {
      const objectExpression = expressions.paths()[0].value.right;
      configFile = j.file(
        j.program([
          j.exportDefaultDeclaration(objectExpression)
        ])
      );

      expressions.remove();
      source = root.toSource(options);
    }
  }

  const configSource = j(configFile).toSource();
  if (process.env.NODE_ENV === 'test') {
    const path = require('path');
    return [
      source,
      `// ${path.basename(configFilePath)}`,
      '/*',
      configSource,
      '*/'
    ].filter(x => !!x).join('\n');
  } else {
    fs.writeFileSync(configFilePath, j(configFile).toSource());
  }

  return source;
};
