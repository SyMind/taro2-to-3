const REACT_APIS = [
  // Class component
  'Component',
  'PureComponent',
  'createRef',
  'createContext',

  // Hooks
  'useEffect',
  'useState',
  'useReducer',
  'useRef',
  'useLayoutEffect',
  'useImperativeHandle',
  'useCallback',
  'useMemo',
  'useContext'
];

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Get all paths that import from Taro
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
    return null;
  }
  const taroPath = taroImportPaths.paths()[0];

  const isDefaultImport = taroPath.value.specifiers.some(
    specifier =>
      specifier.type === 'ImportDefaultSpecifier' &&
      specifier.local.name === 'Taro'
  );

  const reactImportSpecifiers = [];
  const taroImportSpecifiers = [];

  taroPath.value.specifiers
    .filter(specifier => specifier.type === 'ImportSpecifier')
    .forEach(specifier => {
      if (REACT_APIS.indexOf(specifier.imported.name) !== -1) {
        reactImportSpecifiers.push(specifier);
      } else {
        taroImportSpecifiers.push(specifier);
      }
    });

  // Check to see if we should keep the Taro import
  let isTaroImportUsed = root
    .find(j.Identifier, {
      name: 'Taro'
    })
    .filter(path => path.parent.parent.value.type !== 'ImportDeclaration')
    .size() > 0;

  let shouldImportReact = root
    .find(j.JSXElement)
    .size() > 0;
    
  if (isDefaultImport && isTaroImportUsed) {
    const taroUsedApis = root
      .find(j.MemberExpression, {
        object: {
          type: 'Identifier',
          name: 'Taro'
        }
      })
      .filter(path => {
        const property = path.value.property.name;

        const isReactApi = REACT_APIS.indexOf(property) !== -1;
        if (isReactApi) {
          shouldImportReact = true;
          j(path.get('object')).replaceWith(j.identifier('React'));
        }
        return !isReactApi;
      });

    if (taroUsedApis.size() === 0) {
      isTaroImportUsed = false;
    }
  }

  if (isTaroImportUsed) {
    taroImportSpecifiers.unshift(j.importDefaultSpecifier(j.identifier('Taro')));
  }
    
  if (shouldImportReact) {
    reactImportSpecifiers.unshift(j.importDefaultSpecifier(j.identifier('React')));
  }

  const imports = [];

  if (reactImportSpecifiers.length > 0) {
    const reactImportDeclaration = j.importDeclaration(
      reactImportSpecifiers,
      j.literal('react')
    );
    imports.push(reactImportDeclaration);
    j(taroPath).insertBefore(reactImportDeclaration);
  }

  if (taroImportSpecifiers.length) {
    const taroImportDeclaration = j.importDeclaration(
      taroImportSpecifiers,
      j.literal('@tarojs/taro')
    );
    imports.push(taroImportDeclaration);
    j(taroPath).insertBefore(taroImportDeclaration);
  }

  if (imports.length === 0) {
    return;
  }

  if (taroPath.value.comments) {
    imports[0].comments = taroPath.value.comments;
  }

  const blankLine = taroPath.value.loc.end.line;

  j(taroPath).remove();

  const source = root.toSource(options);
  if (imports[0].comments) {
    const lines = source.split('\n');
    if (!lines[blankLine]) {
      lines.splice(blankLine, 1);
    }
    return lines.join('\n');
  }

  return source;
};
