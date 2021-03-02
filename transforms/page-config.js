const fs = require('fs');

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const exportDefaultPaths = root.find(j.ExportDefaultDeclaration, {
    type: 'ExportDefaultDeclaration'
  });

  if (exportDefaultPaths.size() === 0) {
    return;
  }

  const exportDefaultPath = exportDefaultPaths.paths()[0];
    
  if (
    exportDefaultPath.value.declaration.type === 'ClassDeclaration' &&
        exportDefaultPath.value.declaration.superClass.name === 'Component'
  ) {
    const pageClassPath = exportDefaultPath.value.declaration;
        
    const configPath = j(pageClassPath).find(j.ClassProperty, {
      type: 'ClassProperty',
      key: { name: 'config' }
    });
        
    if (configPath.size() === 0) {
      return;
    }

    const objectExpression = configPath.paths()[0].value;

    const configFile = j.file(
      j.program([
        j.exportDefaultDeclaration(objectExpression)
      ])
    );
    const configFilePath = file.path
      .split('.')
      .slice(0, -1)
      .concat('config.js')
      .join('.');
    fs.writeFileSync(configFilePath, j(configFile).toSource());
        
    configPath.remove();
  }
    
  return root.toSource(options);
};
