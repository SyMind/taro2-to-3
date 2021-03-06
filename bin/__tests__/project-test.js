const path = require('path');
const slash = require('slash');
const {unIndent} = require('../utils');
const Project = require('../project');

describe('Project', () => {
  it('throw error when can\'t found taro config', () => {
    const projectDirname = 'without-taro-config';
    const projectDir = path.resolve(__dirname, `../__testfixtures__/project/${projectDirname}`);
    const expectedConfigPath = path.join(projectDir, 'config/index.js');
    expect(() => new Project(projectDir)).toThrowError(
      `Can't found your taro config file: ${slash(expectedConfigPath)}`
    );
  });

  it('throw error when can\'t found taro app entry', () => {
    const projectDirname = 'without-app-entry';
    const projectDir = path.resolve(__dirname, `../__testfixtures__/project/${projectDirname}`);
    expect(() => new Project(projectDir)).toThrowError(
      'Can\'t found your taro entry file, like: src/app.js'
    );
  });

  it('successfully initialized', () => {
    const projectDirname = 'basic';
    const projectDir = path.resolve(__dirname, `../__testfixtures__/project/${projectDirname}`);

    const project = new Project(projectDir);
    expect(project.config).toEqual({
      projectName: 'hello-world',
      sourceRoot: 'src'
    });
    expect(project.configFilePath).toEqual(path.join(projectDir, 'config/index.js'));
    expect(project.entryFiles).toEqual([path.join(projectDir, 'src/app.js')]);
    expect(project.sourceRoot).toEqual('src');
  });

  describe('#transformConfig', () => {
    it('append framework option', () => {
      const transformedConfig = Project.transformConfig(
        unIndent`
          const config = {
            projectName: 'hello-world',
            sourceRoot: 'src',
            sassLoaderOption: {}
          };
        `
      );

      expect(transformedConfig).toEqual(
        unIndent`
          const config = {
            framework: "react",
            projectName: 'hello-world',
            sourceRoot: 'src',
            sassLoaderOption: {}
          };
        `
      );
    });

    it('remove babel option', () => {
      const transformedConfig = Project.transformConfig(
        unIndent`
          const config = {
            projectName: 'hello-world',
            sourceRoot: 'src',
            babel: {
              sourceMap: true,
              presets: [
                ['env', {
                  modules: false
                }]
              ]
            }
          };
        `
      );

      expect(transformedConfig).toEqual(
        unIndent`
          const config = {
            framework: "react",
            projectName: 'hello-world',
            sourceRoot: 'src'
          };
        `
      );
    });

    it('change sassLoaderOption', () => {
      const transformedConfig = Project.transformConfig(
        unIndent`
          const config = {
            projectName: 'hello-world',
            sourceRoot: 'src',
            sassLoaderOption: {
              data: globalSassData
            }
          };
        `
      );

      expect(transformedConfig).toEqual(
        unIndent`
          const config = {
            framework: "react",
            projectName: 'hello-world',
            sourceRoot: 'src',

            sassLoaderOption: {
              prependData: globalSassData
            }
          };
        `
      );
    });

    it('remove deprecated plugins', () => {
      const transformedConfig = Project.transformConfig(
        unIndent`
          const config = {
            projectName: 'hello-world',
            sourceRoot: 'src',
            plugins: [
              '@tarojs/plugin-mock',
              '@tarojs/taro-qq'
            ]
          };
        `
      );

      expect(transformedConfig).toEqual(
        unIndent`
          const config = {
            framework: "react",
            projectName: 'hello-world',
            sourceRoot: 'src',
            plugins: ['@tarojs/plugin-mock']
          };
        `
      );
    });
  });
});
