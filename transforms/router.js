module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const TaroUtils = require('./TaroUtils')(j);

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

  let taroPath = null;
  if (taroImportPaths.size() !== 0) {
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
      const useRouterUsed = root.find(j.CallExpression, {
        type: 'CallExpression',
        callee: {
          name: useRouterImport.local.name
        }
      });

      if (useRouterUsed.size() > 0) {
        useRouterUsed.forEach(path => {
          j(path).replaceWith(
            j.memberExpression(
              j.callExpression(
                j.identifier('getCurrentInstance'),
                []
              ),
              j.identifier('router')
            )
          );
        });

        taroPath.value.specifiers = taroPath.value.specifiers
          .filter(specifier =>
            specifier.type !== 'ImportSpecifier' ||
                specifier.imported.name !== 'useRouter'
          )
          .concat(
            j.importSpecifier(
              j.identifier('getCurrentInstance')
            )
          );
      }
    }

    if (defaultImport) {
      root
        .find(j.CallExpression, {
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
        })
        .forEach(path => {
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
        });
    }
  }

  const taroClassComponents = TaroUtils.findComponentES6ClassDeclaration(root, '@tarojs/taro');
  const reactClassComponents = TaroUtils.findComponentES6ClassDeclaration(root, 'react');

  const classComponents = taroClassComponents.size() > 0
    ? taroClassComponents
    : reactClassComponents;

  if (classComponents.size() > 0) {
    let sholudImportGetCurrentInstance = false;

    classComponents.forEach(component => {
      const routerMemberExpression = j(component).find(j.MemberExpression, {
        type: 'MemberExpression',
        object: {
          type: 'ThisExpression'
        },
        property: {
          type: 'Identifier',
          name: '$router'
        }
      });

      if (routerMemberExpression.size() === 0) {
        return;
      }

      sholudImportGetCurrentInstance = true;
      component.value.body.body.unshift(
        j.classProperty(
          j.identifier('$instance'),
          j.callExpression(
            j.identifier('getCurrentInstance'),
            []
          )
        )
      );

      routerMemberExpression.forEach(identifier => {
        j(identifier).replaceWith(
          j.memberExpression(
            j.memberExpression(
              j.thisExpression(),
              j.identifier('$instance'),
              false
            ),
            j.identifier('router'),
            false
          )
        );
      });
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

  return root.toSource(options);
};
