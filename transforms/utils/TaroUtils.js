module.exports = function(j) {
  const findPkgComponentNameByParent = (path, pkg, parentClassName) => {
    const taroImportDeclaration = path
      .find(j.ImportDeclaration, {
        type: 'ImportDeclaration'
      })
      .filter(path => (
        (
          path.value.source.type === 'Literal' ||
          path.value.source.type === 'StringLiteral'
        ) && path.value.source.value === pkg
      ));
    
    const importDefaultSpecifier = taroImportDeclaration
      .find(j.ImportDefaultSpecifier, {
        type: 'ImportDefaultSpecifier'
      })
      .at(0);
    
    const componentImportSpecifier = taroImportDeclaration
      .find(j.ImportSpecifier, {
        type: 'ImportSpecifier',
        imported: {
          type: 'Identifier',
          name: parentClassName
        }
      })
      .at(0);
    
    const importDefaultPaths = importDefaultSpecifier.paths();
    const pkgDefaultName = importDefaultPaths.length
      ? importDefaultPaths[0].value.local.name
      : undefined;

    const componentImportPaths = componentImportSpecifier.paths();
    const componentName = componentImportPaths.length
      ? componentImportPaths[0].value.local.name
      : undefined;

    return [pkgDefaultName, componentName];
  };
    
  const findComponentES6ClassDeclarationByParent = (path, pkg, parentClassName) => {
    const [defaultImport, componentImport] = findPkgComponentNameByParent(path, pkg, parentClassName);
    
    let selector;
    if (componentImport) {
      selector = {
        superClass: {
          type: 'Identifier',
          name: componentImport
        }
      };
    } else if (defaultImport) {
      selector = {
        superClass: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: defaultImport
          },
          property: {
            type: 'Identifier',
            name: parentClassName
          }
        }
      };
    }
    
    return selector ? path.find(j.ClassDeclaration, selector) : null;
  };
    
  const findComponentES6ClassDeclaration = (path, pkg) => {
    let classDeclarations = findComponentES6ClassDeclarationByParent(path, pkg, 'Component');
    if (!classDeclarations || classDeclarations.size() === 0) {
      classDeclarations = findComponentES6ClassDeclarationByParent(path, pkg, 'PureComponent');
    }
    return classDeclarations;
  };

  const mergeTaroPageConfig = (root, config, env) => {
    const exportDefaultPaths = root.find(j.ExportDefaultDeclaration, {
      type: 'ExportDefaultDeclaration'
    });

    if (exportDefaultPaths.size() === 0) {
      root.paths()[0].value.program.body.push(
        j.exportDefaultDeclaration(config)
      );
    } else {
      const exportDefaultPath = exportDefaultPaths.paths()[0];
      if (exportDefaultPath.value.declaration.type === 'Identifier') {
        if (env) {
          const ifStatement = j.ifStatement(
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
                  config
                )
              )
            ])
          );
          exportDefaultPath.insertBefore(ifStatement);
        } else {
          const name = exportDefaultPath.value.declaration.name;
          const variables = root.find(j.VariableDeclarator, {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name
            }
          });
          if (variables.size() !== 0) {
            const variable = variables.paths()[0];
            variable.value.init = config;
          } else {
            throw Error(`Not found VariableDeclarator: ${name}`);
          }
        }
      } else if (exportDefaultPath.value.declaration.type === 'ObjectExpression') {
        const objectExpression = exportDefaultPath.value.declaration;

        if (env) {
          const variable = j.variableDeclaration(
            'let',
            [
              j.variableDeclarator(
                j.identifier('config'),
                objectExpression
              )
            ]
          );

          const ifStatement = j.ifStatement(
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
                  config
                )
              )
            ])
          );

          exportDefaultPath.value.declaration = j.identifier('config');
          root.paths()[0].value.program.body.unshift(ifStatement);
          root.paths()[0].value.program.body.unshift(variable);
        } else {
          exportDefaultPath.value.declaration = config;
        }
      }
    }
  };
    
  return {
    findComponentES6ClassDeclaration,
    mergeTaroPageConfig
  };
};
