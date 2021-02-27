const REACT_APIS = [
    // Class component
    'Component',
    'PureComponent',
    'createRef',
    'createContext',

    // Hooks
    'useState',
    'useReducer',
    'useRef',
    'useLayoutEffect',
    'useImperativeHandle',
    'useCallback',
    'useMemo',
    'useContext'
]

module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    // Get all paths that import from Taro
    const taroImportPaths = root
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

    const isDefaultImport = taroPath.value.specifiers.some(
        specifier =>
            specifier.type === 'ImportDefaultSpecifier' &&
            specifier.local.name === 'Taro'
    );

    // Check to see if we should keep the Taro import
    const isTaroImportUsed =
        root
            .find(j.Identifier, {
                name: 'Taro'
            })
            .filter(path => path.parent.parent.value.type !== 'ImportDeclaration')
            .size() > 0;

    const shouldImportReact =
        root
            .find(j.JSXElement)
            .size() > 0;

    const reactImportSpecifiers = [];
    const taroImportSpecifiers = []

    taroPath.value.specifiers
        .filter(specifier => specifier.type === 'ImportSpecifier')
        .forEach(specifier => {
            if (REACT_APIS.indexOf(specifier.imported.name) !== -1) {
                reactImportSpecifiers.push(specifier);
            } else {
                taroImportSpecifiers.push(specifier);
            }
        });
    
    if (isTaroImportUsed) {
        taroImportSpecifiers.unshift(j.importDefaultSpecifier(j.identifier('Taro')));

        root
            .find(j.MemberExpression, {
                object: {
                    type: 'Identifier',
                    name: 'Taro',
                },
            })
            .filter(path => {
                const property = path.value.property.name;
                return REACT_APIS.indexOf(property) !== -1
            })
            .forEach(property => {
                j(property.get('object')).replaceWith(j.identifier('React'))
            });
    }
    
    if (shouldImportReact) {
        reactImportSpecifiers.unshift(j.importDefaultSpecifier(j.identifier('React')));
    }

    const reactImportStatement = j.importDeclaration(
        reactImportSpecifiers,
        j.literal('react')
    );
    root.get().node.program.body.unshift(reactImportStatement);

    j(taroPath).insertAfter(
        j.importDeclaration(
            taroImportSpecifiers,
            j.literal('@tarojs/taro')
        )
    );
    j(taroPath).remove();

    return root.toSource({quote: 'single'});
}
