// markers for dependencies usage
const fs = require('fs-extra');
const path = require('path');

const encoding = 'utf8';

const constEnumMarkerPath = path.join(
  require('os').tmpdir(),
  './taro2-to-3-const-enum.marker.txt'
);

const dependencyMarkerPathMap = {
  'babel-plugin-const-enum': constEnumMarkerPath
};

async function start() {
  return await Promise.all(
    Object.values(dependencyMarkerPathMap).map(markPath =>
      fs.open(markPath, 'w')
    )
  );
}

async function markDependency(dependency) {
  const markerPath = dependencyMarkerPathMap[dependency];
  if (markerPath) {
    // add times count
    await fs.appendFile(markerPath, '1', encoding);
  }
}

async function output() {
  const dependencies = Object.keys(dependencyMarkerPathMap);
  const jobs = dependencies.map(async dependencyName => {
    const markerPath = dependencyMarkerPathMap[dependencyName];
    const content = await fs.readFile(markerPath, encoding);
    const times = content.length;
    await fs.unlink(markerPath);
    return times;
  });
  const result = await Promise.all(jobs);
  return dependencies.reduce((prev, dependencyName, index) => {
    const times = result[index];
    if (times) {
      prev[dependencyName] = times;
    }

    return prev;
  }, {});
}

module.exports = {
  start,
  markDependency,
  output
};
