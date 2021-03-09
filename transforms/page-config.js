const path = require('path');
const fs = require('fs');
const {TARO_ENVS} = require('../bin/constants');

const getConfigExpressionSelector = pageComponentName => ({
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
  const TaroUtils = require('./TaroUtils')(j);

  const readConfigFromComments = (root, basename) => {
    const comments = root.paths()[0].value.program.body[0].comments;
    root.paths()[0].value.program.body[0].comments = [];

    if (comments) {
      let commentBlock;
      for (let i = 1; i < comments.length; i++) {
        if (
          comments[i - 1].type === 'CommentLine' &&
          comments[i - 1].value.trim() === basename
        ) {
          commentBlock = comments[i];
        }
      }

      if (commentBlock) {
        return j(commentBlock.value);
      }
    }
  };

  const root = j(file.source);

  const pages = typeof options.pages === 'string'
    ? options.pages.split(',')
    : [];
  let pathSubs = file.path.split('.').slice(0, -1);
  if (Object.values(TARO_ENVS).some(e => e === pathSubs[pathSubs.length - 1])) {
    pathSubs = pathSubs.slice(0, -1);
  }
  const isPage = pages.some(p => pathSubs.join('.').endsWith(p));
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

  let configFilePathSubs = file.path.split('.').slice(0, -1);
  const last = configFilePathSubs[configFilePathSubs.length - 1];
  let env;
  if (Object.values(TARO_ENVS).some(e => last === e)) {
    configFilePathSubs = configFilePathSubs.slice(0, -1);
    env = last;
  }
  const configFilePath = configFilePathSubs.concat(['config', ext].join('')).join('.');

  let source;
  let objectExpression = j.objectExpression([]);
  let configFile = j.file(
    j.program([
      j.exportDefaultDeclaration(
        objectExpression
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
      objectExpression = properties.paths()[0].value.value;
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
        getConfigExpressionSelector(pageComponentName)
      );

      if (expressions.size() !== 0) {
        objectExpression = expressions.paths()[0].value.right;
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
      getConfigExpressionSelector(pageComponentName)
    );

    if (expressions.size() !== 0) {
      objectExpression = expressions.paths()[0].value.right;
      configFile = j.file(
        j.program([
          j.exportDefaultDeclaration(objectExpression)
        ])
      );

      expressions.remove();
      source = root.toSource(options);
    }
  }

  const configSource = j(configFile).toSource(options);
  if (process.env.NODE_ENV === 'test') {
    const configFileBasename = path.basename(configFilePath);
    const existedConfigRoot = readConfigFromComments(root, configFileBasename);

    if (existedConfigRoot) {
      TaroUtils.mergeTaroPageConfig(existedConfigRoot, objectExpression, env);
      return [
        root.toSource(options),
        `// ${configFileBasename}`,
        '/*',
        existedConfigRoot.toSource(options).trim(),
        '*/'
      ].filter(x => !!x).join('\n');
    }

    return [
      source,
      `// ${configFileBasename}`,
      '/*',
      configSource,
      '*/'
    ].filter(x => !!x).join('\n');
  } else {
    if (fs.existsSync(configFilePath)) {
      const existedConfigRoot = j(fs.readFileSync(configFilePath, 'utf-8'));
      TaroUtils.mergeTaroPageConfig(existedConfigRoot, objectExpression, env);
      fs.writeFileSync(configFilePath, existedConfigRoot.toSource(options));
    } else {
      fs.writeFileSync(configFilePath, j(configFile).toSource(options));
    }
  }

  return source;
};
