module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const exportDefaultPaths =
        root
            .find(j.ExportDefaultDeclaration, {
                type: 'ExportDefaultDeclaration',
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
        j(pageClassPath)
            .find(j.ClassProperty, {
                type: 'ClassProperty',
                key: { name: 'config' }
            })
            .remove();
    }
    
    return root.toSource({quote: 'single'});
}
