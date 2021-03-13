const config = {
  projectName: 'hello-world',
  sourceRoot: 'src'
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }

  return merge({}, config, require('./prod'));
};
