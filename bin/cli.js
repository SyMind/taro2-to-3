#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const execa = require('execa');
const isGitClean = require('is-git-clean');
const readPkgUp = require('read-pkg-up');
const Table = require('cli-table');
const inquirer = require('inquirer');
const semverSatisfies = require('semver/functions/satisfies');
const jscodeshiftBin = require.resolve('.bin/jscodeshift');

const taroDeps = require('./taroDeps');

const transformersDir = path.join(__dirname, '../transforms');
const Project = require('./project');

// override default babylon parser config to enable `decorator-legacy`
// https://github.com/facebook/jscodeshift/blob/master/parser/babylon.js
const babylonConfig = path.join(__dirname, './babylon.config.json');

const transformers = [
  'taro-imports',
  'router',
  'page-config'
];

const dependencyProperties = [
  'dependencies',
  'devDependencies',
  'clientDependencies',
  'isomorphicDependencies',
  'buildDependencies'
];

const tableChars = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: ''
};

async function ensureGitClean() {
  let clean = false;
  try {
    clean = await isGitClean();
  } catch (err) {
    if (err && err.stderr && err.stderr.toLowerCase().includes('not a git repository')) {
      clean = true;
    }
  }

  if (!clean) {
    console.log(chalk.yellow('Sorry that there are still some git changes'));
    console.log('\n you must commit or stash them firstly');
    process.exit(1);
  }
}

function getRunnerArgs(
  transformerPath,
  parser = 'babylon', // use babylon as default parser
  options = {}
) {
  const args = [
    '--verbose=2',
    '--ignore-pattern=**/node_modules',
    '--quote=single'
  ];

  // limit usage for cpus
  const cpus = options.cpus || Math.max(2, Math.ceil(os.cpus().length / 3));
  args.push('--cpus', cpus);

  // https://github.com/facebook/jscodeshift/blob/master/src/Runner.js#L255
  // https://github.com/facebook/jscodeshift/blob/master/src/Worker.js#L50
  args.push('--no-babel');

  args.push('--parser', parser);

  args.push('--parser-config', babylonConfig);
  args.push('--extensions=tsx,ts,jsx,js');

  args.push('--transform', transformerPath);

  if (options.gitignore) {
    args.push('--ignore-config', options.gitignore);
  }

  if (options.style) {
    args.push('--importStyles');
  }

  if (options.pages) {
    args.push(`--pages=${options.pages}`);
  }
  return args;
}

async function run(filePath, args = {}) {
  for (const transformer of transformers) {
    await transform(transformer, 'babylon', filePath, args);
  }
}

async function transform(transformer, parser, filePath, options) {
  console.log(chalk.bgGreen.bold('Transform'), transformer);
  const transformerPath = path.join(transformersDir, `${transformer}.js`);

  const args = [filePath].concat(
    getRunnerArgs(transformerPath, parser, options)
  );

  try {
    if (process.env.NODE_ENV === 'local') {
      console.log(`Running jscodeshift with: ${args.join(' ')}`);
    }
    await execa(jscodeshiftBin, args, {
      stdio: 'inherit',
      stripEof: false
    });
  } catch (err) {
    console.error(err);
    if (process.env.NODE_ENV === 'local') {
      const errorLogFile = path.join(__dirname, './error.log');
      fs.appendFileSync(errorLogFile, err);
      fs.appendFileSync(errorLogFile, '\n');
    }
  }
}

async function checkDependencies(targetDir) {
  const cwd = path.join(process.cwd(), targetDir);
  const closetPkgJson = await readPkgUp({ cwd });

  if (!closetPkgJson) {
    console.log('We didn\'t find your package.json');
    return;
  }

  const { packageJson } = closetPkgJson;
  const upgradeDeps = Object.create(null);
  const deprecatedDeps = [];
  const additionsDeps = taroDeps.additions;
  dependencyProperties.forEach(property => {
    const deps = packageJson[property];
    if (!deps) {
      return;
    }

    const {expectVersion, deprecated, upgrade} = taroDeps;
    deprecated.forEach(depName => {
      if (deps[depName]) {
        deprecatedDeps.push(depName);
      }
    });
    upgrade.forEach(depName => {
      const versionRange = deps[depName];
      if (!!versionRange && !semverSatisfies(expectVersion, versionRange)) {
        upgradeDeps[depName] = [versionRange, expectVersion];
      }
    });
  });

  console.log('----------- taro dependencies alert -----------\n');
  console.log(
    chalk.yellow(
      'Should install/uninstall/upgrade these dependencies to ensure working well with taro3'
    )
  );

  const upgradeDepsTable = new Table({
    colAligns: ['left', 'right', 'right', 'right'],
    chars: tableChars
  });
  const additionsDepsTable = new Table({
    colAligns: ['left', 'right'],
    chars: tableChars
  });
  Object.keys(upgradeDeps).forEach(depName => {
    const [from, expect] = upgradeDeps[depName];
    upgradeDepsTable.push([depName, from, '→', expect]);
  });
  additionsDeps.forEach(depName => additionsDepsTable.push([depName, '^3.1.1']));
  console.log('\n* Install\n');
  console.log(chalk.green(additionsDepsTable.toString()));
  console.log('\n* Upgrade\n');
  console.log(chalk.blue(upgradeDepsTable.toString()));
  console.log('\n* Uninstall\n');
  console.log(chalk.red(deprecatedDeps.join('\n')));
  console.log('\n');

  const pkgs = Object.keys(upgradeDeps).map(depName => {
    const [, expect] = upgradeDeps[depName];
    return `${depName}@${expect}`;
  });

  const {theme} = await inquirer.prompt([{
    type: 'rawlist',
    name: 'theme',
    message: 'Do you need to install/uninstall/upgrade these dependencies automatically?',
    choices: [
      'Yes (use npm)',
      'Yes (use yarn)',
      'No'
    ]
  }]);

  let bin;
  if (theme === 'Yes (use npm)') {
    bin = 'npm';
  } else if (theme === 'Yes (use yarn)') {
    bin = 'yarn';
  }

  if (bin) {
    console.log(chalk.gray(`\n> ${bin} install ${pkgs.concat(additionsDeps).join(' ')}\n`));
    await execa(bin, ['install', ...pkgs.concat(additionsDeps)], {
      stdio: 'inherit',
      stripEof: false
    });

    console.log(chalk.gray(`\n> ${bin} uninstall ${deprecatedDeps.join(' ')}\n`));
    await execa(bin, ['uninstall', ...deprecatedDeps], {
      stdio: 'inherit',
      stripEof: false
    });
  }
}

/**
 * options
 * --force   // force skip git checking (dangerously)
 * --cpus=1  // specify cpus cores to use
 */
async function bootstrap() {
  const args = require('yargs-parser')(process.argv.slice(3));
  if (process.env.NODE_ENV !== 'local') {
    // 检查 git 状态
    if (!args.force) {
      await ensureGitClean();
    } else {
      console.log(
        Array(3)
          .fill(1)
          .map(() =>
            chalk.yellow(
              'WARNING: You are trying to skip git status checking, please be careful'
            )
          )
          .join('\n')
      );
    }
  }

  let project;
  try {
    project = new Project(process.cwd());
  } catch (error) {
    console.log(chalk.red(error.message));
    process.exit(1);
  }
  project.transformEntry();

  args.pages = project.pages.join(',');
  await run(project.sourceRoot, args);
  await checkDependencies(project.sourceRoot);

  console.log('\n----------- Thanks for using taro-2-to-3 -----------');
}

bootstrap();
