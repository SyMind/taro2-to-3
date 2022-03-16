function findComponentOrHook(path) {
  while (path) {
    if (
      path.value.type === 'FunctionDeclaration' ||
      path.value.type === 'FunctionExpression' ||
      path.value.type === 'FunctionExpression' ||
      path.value.type === 'ArrowFunctionExpression'
    ) {
      return path;
    }
    path = path.parentPath;
  }
  return false;
}

function getClassOwnPropSelector(name) {
  return {
    type: 'MemberExpression',
    object: {
      type: 'ThisExpression'
    },
    property: {
      type: 'Identifier',
      name
    }
  };
}

const DEFAULT_INSTANCE_NAME = '$instance';

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const TaroUtils = require('./utils/TaroUtils')(j);

  function findInstanceName(componentOrHook, useMemoLocalName) {
    const usedNamedImportPaths = j(componentOrHook).find(j.VariableDeclarator, {
      type: 'VariableDeclarator',
      id: {
        type: 'Identifier'
      },
      init: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: useMemoLocalName || 'useMemo'
        },
        arguments: [
          {
            type: 'Identifier',
            name: 'getCurrentInstance'
          },
          {
            type: 'ArrayExpression'
          }
        ]
      }
    });

    const usedDefaultImportPaths = j(componentOrHook).find(j.VariableDeclarator, {
      type: 'VariableDeclarator',
      id: {
        type: 'Identifier'
      },
      init: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'Identifier',
            name: 'React'
          },
          property: {
            type: 'Identifier',
            name: 'useMemo'
          }
        },
        arguments: [
          {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: 'Taro'
            },
            property: {
              type: 'Identifier',
              name: 'getCurrentInstance'
            }
          },
          {
            type: 'ArrayExpression'
          }
        ]
      }
    });

    if (usedNamedImportPaths.size() === 0 && usedDefaultImportPaths.size() === 0) {
      return null;
    }

    const usedPath = usedNamedImportPaths.size() > 0
      ? usedNamedImportPaths
      : usedDefaultImportPaths;

    return usedPath.paths()[0].value.id.name;
  }

  function ensureInstanceClassProp(classDclPath) {
    const instancePopPaths = j(classDclPath).find(j.ClassProperty, {
      type: 'ClassProperty',
      value: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'getCurrentInstance'
        }
      }
    });

    if (instancePopPaths.size() > 0) {
      return instancePopPaths.paths()[0].key.name;
    }

    const classBody = classDclPath.value.body.body;
    classBody.unshift(
      j.classProperty(
        j.identifier(DEFAULT_INSTANCE_NAME),
        j.callExpression(
          j.identifier('getCurrentInstance'),
          []
        )
      )
    );

    return DEFAULT_INSTANCE_NAME;
  }

  function replaceClassOwnPropWithInstance(classDclPath, deprecatedApi, currentApi) {
    const exps = j(classDclPath).find(j.MemberExpression, getClassOwnPropSelector(deprecatedApi));
    if (exps.size() === 0) {
      return false;
    }

    const instancePropName = ensureInstanceClassProp(classDclPath);
    exps.forEach(exp => {
      j(exp).replaceWith(
        j.memberExpression(
          j.memberExpression(
            j.thisExpression(),
            j.identifier(instancePropName),
            false
          ),
          j.identifier(currentApi),
          false
        )
      );
    });
    return true;
  }

  const taroImportPaths = root
    .find(j.ImportDeclaration, {
      type: 'ImportDeclaration'
    })
    .filter(path => (
      (
        path.value.source.type === 'Literal' ||
        path.value.source.type === 'StringLiteral'
      ) && path.value.source.value === '@tarojs/taro'
    ));

  const reactImportPaths = root
    .find(j.ImportDeclaration, {
      type: 'ImportDeclaration'
    })
    .filter(path => (
      (
        path.value.source.type === 'Literal' ||
        path.value.source.type === 'StringLiteral'
      ) && path.value.source.value === 'react'
    ));

  if (taroImportPaths.size() === 0 && reactImportPaths.size() === 0) {
    return;
  }

  // Use the react import declaration first.
  const importPaths = reactImportPaths.size() > 0 ? reactImportPaths : taroImportPaths;

  const useMemoPaths = importPaths.find(j.ImportSpecifier, {
    type: 'ImportSpecifier',
    imported: {
      type: 'Identifier',
      name: 'useMemo'
    }
  });
  let useMemoLocalName = null;
  if (useMemoPaths.size() > 0) {
    useMemoLocalName = useMemoPaths.paths()[0].value.local.name;
  }

  let taroPath = null;
  let shouldImportUseMemo = false;
  let shouldImportReact = false;
  let transformed = false;

  // Handle function component.
  if (taroImportPaths.size() > 0) {
    taroPath = taroImportPaths.paths()[0];

    const useRouterImport = taroPath.value.specifiers.find(
      specifier =>
        specifier.type === 'ImportSpecifier' &&
        specifier.imported.name === 'useRouter'
    );

    const defaultImport = taroPath.value.specifiers.find(
      specifier => specifier.type === 'ImportDefaultSpecifier'
    );

    if (useRouterImport) {
      const useRouterCalls = root.find(j.CallExpression, {
        type: 'CallExpression',
        callee: {
          name: useRouterImport.local.name
        }
      });

      if (useRouterCalls.size() > 0) {
        transformed = true;

        useRouterCalls.forEach(path => {
          const componentOrHook = findComponentOrHook(path);
          if (componentOrHook) {
            const instanceName = findInstanceName(componentOrHook, useMemoLocalName);
            if (!instanceName) {
              shouldImportUseMemo = true;

              componentOrHook.value.body.body.unshift(
                j.variableDeclaration(
                  'const',
                  [
                    j.variableDeclarator(
                      j.identifier(DEFAULT_INSTANCE_NAME),
                      j.callExpression(
                        j.identifier(useMemoLocalName || 'useMemo'),
                        [
                          j.identifier('getCurrentInstance'),
                          j.arrayExpression([])
                        ]
                      )
                    )
                  ]
                )
              );
            }

            j(path).replaceWith(
              j.memberExpression(
                j.identifier(instanceName || DEFAULT_INSTANCE_NAME),
                j.identifier('router')
              )
            );
          } else {
            j(path).replaceWith(
              j.memberExpression(
                j.callExpression(
                  j.identifier('getCurrentInstance'),
                  []
                ),
                j.identifier('router')
              )
            );
          }
        });

        taroPath.value.specifiers = taroPath.value.specifiers
          .filter(specifier =>
            specifier.type !== 'ImportSpecifier' ||
            specifier.imported.name !== useRouterImport.local.name
          )
          .concat(
            j.importSpecifier(
              j.identifier('getCurrentInstance')
            )
          );
      }
    }
    
    if (defaultImport) {
      const useRouterCalls = root.find(j.CallExpression, {
        type: 'CallExpression',
        callee: {
          object: {
            type: 'Identifier',
            name: 'Taro'
          },
          property: {
            type: 'Identifier',
            name: 'useRouter'
          }
        }
      });
      if (useRouterCalls.size() > 0) {
        transformed = true;

        useRouterCalls.forEach(path => {
          const componentOrHook = findComponentOrHook(path);
          if (componentOrHook) {
            const instanceName = findInstanceName(componentOrHook, useMemoLocalName);
            if (!instanceName) {
              shouldImportReact = true;

              componentOrHook.value.body.body.unshift(
                j.variableDeclaration(
                  'const',
                  [
                    j.variableDeclarator(
                      j.identifier(DEFAULT_INSTANCE_NAME),
                      j.callExpression(
                        j.memberExpression(
                          j.identifier('React'),
                          j.identifier('useMemo')
                        ),
                        [
                          j.memberExpression(
                            j.identifier('Taro'),
                            j.identifier('getCurrentInstance')
                          ),
                          j.arrayExpression([])
                        ]
                      )
                    )
                  ]
                )
              );
            }

            j(path).replaceWith(
              j.memberExpression(
                j.identifier(instanceName || DEFAULT_INSTANCE_NAME),
                j.identifier('router')
              )
            );
          } else {
            j(path).replaceWith(
              j.memberExpression(
                j.memberExpression(
                  j.identifier(defaultImport.local.name),
                  j.callExpression(
                    j.identifier('getCurrentInstance'),
                    []
                  )
                ),
                j.identifier('router')
              )
            );
          }
        });
      }
    }
  }

  // Handle class component.
  const taroClassComponents = TaroUtils.findComponentES6ClassDeclaration(root, '@tarojs/taro');
  const reactClassComponents = TaroUtils.findComponentES6ClassDeclaration(root, 'react');

  const classComponents = taroClassComponents && taroClassComponents.size() > 0 ? taroClassComponents : reactClassComponents;
  if (classComponents && classComponents.size() > 0) {
    let sholudImportGetCurrentInstance = false;

    classComponents.forEach(classDclPath => {
      if (replaceClassOwnPropWithInstance(classDclPath, '$router', 'router')) {
        transformed = true;
        sholudImportGetCurrentInstance = true;
      }
    });

    if (sholudImportGetCurrentInstance) {
      if (taroPath) {
        taroPath.value.specifiers.push(
          j.importSpecifier(
            j.identifier('getCurrentInstance')
          )
        );
      } else {
        reactImportPaths.insertAfter(
          j.importDeclaration(
            [
              j.importSpecifier(
                j.identifier('getCurrentInstance')
              )
            ],
            j.stringLiteral('@tarojs/taro'),
            'value'
          )
        );
      }
    }
  }

  if (shouldImportUseMemo && !useMemoLocalName) {
    const reactImportPath = reactImportPaths.paths()[0];
    if (reactImportPath) {
      reactImportPath.value.specifiers.push(
        j.importSpecifier(
          j.identifier('useMemo')
        )
      );
    } else {
      const reactImportDeclaration = j.importDeclaration(
        [j.importSpecifier(j.identifier('useMemo'))],
        j.literal('react')
      );
      j(taroPath).insertBefore(reactImportDeclaration);
    }
  } else if (shouldImportReact && reactImportPaths.size() === 0) {
    const reactImportDeclaration = j.importDeclaration(
      [j.importDefaultSpecifier(j.identifier('React'))],
      j.literal('react')
    );
    j(taroPath).insertBefore(reactImportDeclaration);
  }

  if (transformed) {
    return root.toSource(options);
  }
};
