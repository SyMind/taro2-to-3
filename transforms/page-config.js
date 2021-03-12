const path = require('path');
const fs = require('fs');
const {TARO_ENVS} = require('../bin/constants');

const configExpSelector = pageComponentName => ({
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

const ENV_ALTERNATION = Object.values(TARO_ENVS).join('|');
const EXT_ALTERNATION = ['js', 'jsx', 'ts', 'tsx'].join('|');
const REG_EXP_ENDING = `(?:/index)?(?:.(${ENV_ALTERNATION}))?.(?:${EXT_ALTERNATION})`;

function pagesToRegExps(pages) {
  const paths = typeof pages === 'string'
    ? pages.split(',')
    : [];
  return paths.map(p => new RegExp(`${p}${REG_EXP_ENDING}`));
}

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const TaroUtils = require('./TaroUtils')(j);

  const evalConfigComments = (root, basename) => {
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

    return null;
  };

  const createEnvIfStatement = (env, configObjExp) =>
    j.ifStatement(
      j.binaryExpression(
        '===',
        j.memberExpression(
          j.memberExpression(
            j.identifier('process'),
            j.identifier('env')
          ),
          j.identifier('TARO_ENV')
        ),
        j.stringLiteral(env)
      ),
      j.blockStatement([
        j.expressionStatement(
          j.assignmentExpression(
            '=',
            j.identifier('config'),
            configObjExp
          )
        )
      ])
    );

  const createConfigFile = (env, configObjExp, typeAnnotation) => {
    let body;
    if (env) {
      body = [
        j.variableDeclaration(
          'let',
          [
            j.variableDeclarator(
              j.identifier('config')
            )
          ]
        ),
        createEnvIfStatement(env, configObjExp),
        j.exportDefaultDeclaration(
          j.identifier('config')
        )
      ];
    } else if (typeAnnotation) {
      const typeIdentifierName = typeAnnotation.typeAnnotation.typeName.name;

      const typeSpecifiers = root
        .find(j.ImportDeclaration, {
          type: 'ImportDeclaration'
        })
        .filter(path => (
          (
            path.value.source.type === 'Literal' ||
            path.value.source.type === 'StringLiteral'
          ) && path.value.source.value === '@tarojs/taro'
        ))
        .find(j.ImportSpecifier, {
          type: 'ImportSpecifier',
          local: {
            type: 'Identifier',
            name: typeIdentifierName
          }
        });

      const typeReferences = root
        .find(j.TSTypeReference, {
          type: 'TSTypeReference',
          typeName: {
            type: 'Identifier',
            name: typeIdentifierName
          }
        });

      if (typeReferences.size() === 1) {
        const typeSpecifier = typeSpecifiers.paths()[0];
        const specifiers = typeSpecifier.parentPath;
        const importKind = specifiers.parentPath.value.importKind;
        if (specifiers.value.length === 1) {
          j(specifiers.parentPath).remove();
        } else {
          j(typeSpecifier).remove();
        }

        const configIdentifier = j.identifier('config');
        configIdentifier.typeAnnotation = typeAnnotation;

        body = [
          j.importDeclaration(
            [typeSpecifier.value],
            j.literal('@tarojs/taro'),
            importKind
          ),
          j.variableDeclaration(
            'const',
            [
              j.variableDeclarator(
                configIdentifier,
                configObjExp
              )
            ]
          ),
          j.exportDefaultDeclaration(
            j.identifier('config')
          )
        ];
      }
    } else {
      body = [j.exportDefaultDeclaration(configObjExp)];
    }

    return j.file(
      j.program(body)
    );
  };

  const root = j(file.source);

  const pageRegExps = pagesToRegExps(options.pages);
  const currentPageRegExp = pageRegExps.find(regExp => regExp.test(file.path));
  if (!currentPageRegExp) {
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

  const env = currentPageRegExp.exec(file.path)[1];
  const suffixIndex = env ? -2 : -1;
  const configFilePath = file.path
    .split('.')
    .slice(0, suffixIndex)
    .concat(`config${ext}`)
    .join('.');

  let source;
  let configObjExp = j.objectExpression([]);
  let configFile = j.file(
    j.program([
      j.exportDefaultDeclaration(
        configObjExp
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
    const pageComponentName = pageComponent.id ? pageComponent.id.name : null;
    if (pageComponentName) {
      const properties = j(pageComponent).find(j.ClassProperty, {
        type: 'ClassProperty',
        key: {
          name: 'config'
        }
      });
      if (properties.size() !== 0) {
        const configProperty = properties.paths()[0].value;
        const typeAnnotation = configProperty.typeAnnotation;
        configObjExp = configProperty.value;
        configFile = createConfigFile(env, configObjExp, typeAnnotation);
        properties.remove();
        source = root.toSource(options);
      } else {
        const expressions = root.find(
          j.AssignmentExpression,
          configExpSelector(pageComponentName)
        );

        if (expressions.size() !== 0) {
          configObjExp = expressions.paths()[0].value.right;
          configFile = createConfigFile(env, configObjExp);
          expressions.remove();
          source = root.toSource(options);
        }
      }
    }
  } else if (
    pageComponent.type === 'FunctionDeclaration' || (
      pageComponent.type === 'VariableDeclarator' &&
      pageComponent.init.type === 'ArrowFunctionExpression'
    )
  ) {
    const pageComponentName = pageComponent.id ? pageComponent.id.name : null;
    if (pageComponentName) {
      const expressions = root.find(
        j.AssignmentExpression,
        configExpSelector(pageComponentName)
      );

      if (expressions.size() !== 0) {
        configObjExp = expressions.paths()[0].value.right;
        configFile = createConfigFile(env, configObjExp);
        expressions.remove();
        source = root.toSource(options);
      }
    }
  }

  const configSource = j(configFile).toSource(options);
  if (process.env.NODE_ENV === 'test') {
    const configFileBasename = path.basename(configFilePath);
    const existedConfigRoot = evalConfigComments(root, configFileBasename);

    if (existedConfigRoot) {
      TaroUtils.mergeTaroPageConfig(existedConfigRoot, configObjExp, env);
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
      TaroUtils.mergeTaroPageConfig(existedConfigRoot, configObjExp, env);
      fs.writeFileSync(configFilePath, existedConfigRoot.toSource(options));
    } else {
      fs.writeFileSync(configFilePath, j(configFile).toSource(options));
    }
  }

  return source;
};
