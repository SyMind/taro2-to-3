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

  if (taroImportPaths.size() === 0) {
    return;
  }

  const taroPath = taroImportPaths.paths()[0];

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

  const taroClassComponents = TaroUtils.findTaroES6ClassDeclaration(root);

  if (taroClassComponents.size() > 0) {
    let sholudImportGetCurrentInstance = false;

    taroClassComponents.forEach(component => {
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
      taroPath.value.specifiers.push(
        j.importSpecifier(
          j.identifier('getCurrentInstance')
        )
      );
    }
  }

  return root.toSource(options);
};
