const fs = require('fs');

module.exports = function (file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const pages = typeof options.pages === 'string'
    ? options.pages.split(',')
    : [];

  const isPage = pages.some(p => file.path.split('.').slice(0, -1).join('.').endsWith(p));

  if (!isPage) {
    return;
  }

  const exportDefaultPaths = root.find(j.ExportDefaultDeclaration, {
    type: 'ExportDefaultDeclaration'
  });

  if (exportDefaultPaths.size() === 0) {
    return;
  }

  const configFilePath = file.path
    .split('.')
    .slice(0, -1)
    .concat('config.js')
    .join('.');

  let source;
  let configFile = j.file(
    j.program([
      j.exportDefaultDeclaration(
        j.objectExpression([])
      )
    ])
  );

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

    if (configPath.size() !== 0) {
      const objectExpression = configPath.paths()[0].value.value;

      configFile = j.file(
        j.program([
          j.exportDefaultDeclaration(objectExpression)
        ])
      );

      configPath.remove();

      source = root.toSource(options);
    }
  }

  const configSource = j(configFile).toSource();
  if (process.env.NODE_ENV === 'test') {
    const path = require('path');
    return [
      source,
      `// ${path.basename(configFilePath)}`,
      '/*',
      configSource,
      '*/'
    ].filter(x => !!x).join('\n');
  } else {
    fs.writeFileSync(configFilePath, j(configFile).toSource());
  }

  return source;
};
