const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const execa = require('execa');
const isGitClean = require('is-git-clean');
const readPkgUp = require('read-pkg-up');
const Table = require('cli-table');
const semverSatisfies = require('semver/functions/satisfies');
const jscodeshiftBin = require.resolve('.bin/jscodeshift');

const taroDeps = require('./taroDeps');

const transformersDir = path.join(__dirname, '../transforms');

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
  const args = ['--verbose=2', '--ignore-pattern=**/node_modules'];

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

  args.push('--antdPkgNames=antd,@alipay/bigfish/antd');
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
  const table = new Table({
    colAligns: ['left', 'right', 'right', 'right'],
    chars: {
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
    }
  });
  Object.keys(upgradeDeps).forEach(depName => {
    const [from, expect] = upgradeDeps[depName];
    table.push([depName, from, '→', expect]);
  });
  console.log('* Update');
  console.log(table.toString());
  console.log('* Install');
  console.log(additionsDeps);
  console.log('* Deprecated');
  console.log(deprecatedDeps);
}

/**
 * options
 * --force   // force skip git checking (dangerously)
 * --cpus=1  // specify cpus cores to use
 */
async function bootstrap() {
  const dir = process.argv[2];
  const args = require('yargs-parser')(process.argv.slice(3));
  if (process.env.NODE_ENV !== 'local') {
    // check for git status
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

  // check for `path`
  if (!dir || !fs.existsSync(dir)) {
    console.log(chalk.yellow('Invalid dir:', dir, ', please pass a valid dir'));
    process.exit(1);
  }
  await run(dir, args);

  await checkDependencies(dir);

  console.log('----------- Thanks for using taro-2-to-3 -----------');
}

module.exports = {
  bootstrap,
  run,
  getRunnerArgs
};
