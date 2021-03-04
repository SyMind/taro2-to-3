module.exports = function(j) {
  const findTaroComponentNameByParent = (path, parentClassName) => {
    const taroImportDeclaration = path
      .find(j.ImportDeclaration, {
        type: 'ImportDeclaration'
      })
      .filter(path => (
        (
          path.value.source.type === 'Literal' ||
          path.value.source.type === 'StringLiteral'
        ) && path.value.source.value === '@tarojs/taro'
      ));
    
    const componentImportSpecifier = taroImportDeclaration
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
            name: 'Taro'
          },
          property: {
            type: 'Identifier',
            name: parentClassName
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
    
  return {
    findTaroES6ClassDeclaration
  };
};
