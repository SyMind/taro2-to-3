const path = require('path');
const Project = require('../project');

describe('Project', () => {
  it('Throw error when can\'t found taro config', () => {
    const projectDirname = 'project-without-taro-config';
    const project1Dir = path.resolve(__dirname, `../__testfixtures__/${projectDirname}`);
    const expectedConfigPath = path.join(project1Dir, 'config/index.js');
    expect(() => new Project(project1Dir)).toThrowError(
      `We can't found your taro config file: ${expectedConfigPath}`
    );
  });
});
