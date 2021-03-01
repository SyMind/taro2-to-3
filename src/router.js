module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const taroImportPaths =
        root
            .find(j.ImportDeclaration, {
                type: 'ImportDeclaration',
            })
            .filter(path => (
                (
                    path.value.source.type === 'Literal' ||
                    path.value.source.type === 'StringLiteral'
                ) && path.value.source.value === '@tarojs/taro'
            ));

    if (taroImportPaths.size() === 0) {
        return null;
    }
    const taroPath = taroImportPaths.paths()[0];

    const findTaroComponentNameByParent = (path, parentClassName) => {
        const taroImportDeclaration =
            path
                .find(j.ImportDeclaration, {
                    type: 'ImportDeclaration'
                })
                .filter(path => (
                    (
                        path.value.source.type === 'Literal' ||
                        path.value.source.type === 'StringLiteral'
                    ) && path.value.source.value === '@tarojs/taro'
                ));

        const componentImportSpecifier =
            taroImportDeclaration
                .find(j.ImportSpecifier, {
                    type: 'ImportSpecifier',
                    imported: {
                        type: 'Identifier',
                        name: parentClassName
                    }
                })
                .at(0);

        const paths = componentImportSpecifier.paths();
        return paths.length
            ? paths[0].value.local.name
            : undefined;
    };

    const findTaroES6ClassDeclarationByParent = (path, parentClassName) => {
        const componentImport = findTaroComponentNameByParent(path, parentClassName);
    
        const selector = componentImport
            ? {
                superClass: {
                    type: 'Identifier',
                    name: componentImport
                }
            }
            : {
                superClass: {
                    type: 'MemberExpression',
                    object: {
                        type: 'Identifier',
                        name: 'Taro',
                    },
                    property: {
                        type: 'Identifier',
                        name: parentClassName,
                    }
                }
            };
    
        return path.find(j.ClassDeclaration, selector);
    };

    const findTaroES6ClassDeclaration = path => {
        let classDeclarations = findTaroES6ClassDeclarationByParent(path, 'Component');
        if (classDeclarations.size() === 0) {
            classDeclarations = findTaroES6ClassDeclarationByParent(path, 'PureComponent');
        }
        return classDeclarations;
    };

    const taroClassComponents = findTaroES6ClassDeclaration(root);

    if (taroClassComponents.size() === 0) {
        return;
    }

    let sholudImportGetCurrentInstance = false;

    taroClassComponents.forEach(component => {
        const routerMemberExpression =
            j(component)
                .find(j.MemberExpression, {
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
        )

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
            )
        })
    })

    if (sholudImportGetCurrentInstance) {
        taroPath.value.specifiers.push(
            j.importSpecifier(
                j.identifier('getCurrentInstance')
            )
        );
    }

    return root.toSource({quote: 'single'});
}
