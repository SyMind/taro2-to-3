module.exports = {
  deprecated: [
    '@tarojs/utils',
    '@tarojs/async-await',
    '@tarojs/components-rn',
    '@tarojs/components-qa',
    '@tarojs/plugin-babel',
    '@tarojs/plugin-csso',
    '@tarojs/plugin-sass',
    '@tarojs/plugin-terser',
    '@tarojs/plugin-uglify',
    '@tarojs/plugin-typescript',
    '@tarojs/plugin-less',
    '@tarojs/plugin-stylus',
    '@tarojs/redux',
    '@tarojs/redux-h5',
    '@tarojs/taro-redux-rn',
    '@tarojs/taro-rn',
    '@tarojs/taro-router-rn',
    '@tarojs/rn-runner',
    '@tarojs/taro-quickapp',
    '@tarojs/transformer-wx',
    'postcss-taro-unit-transform',
    'babel-plugin-transform-jsx-to-stylesheet',
    '@tarojs/mobx',
    '@tarojs/mobx-common',
    '@tarojs/mobx-h5',
    '@tarojs/mobx-rn',
    'stylelint-taro-rn',
    'stylelint-config-taro-rn',
    'taro-css-to-react-native',
    '@tarojs/taro-alipay',
    '@tarojs/taro-swan',
    '@tarojs/taro-tt',
    '@tarojs/taro-weapp'
  ],
  upgrade: [
    'babel-plugin-transform-taroapi',
    'eslint-config-taro',
    'eslint-plugin-taro',
    'postcss-plugin-constparse',
    'postcss-pxtransform',
    '@tarojs/taro',
    '@tarojs/cli',
    '@tarojs/components',
    '@tarojs/taro-h5',
    '@tarojs/helper',
    '@tarojs/mini-runner',
    '@tarojs/router',
    '@tarojs/runner-utils',
    '@tarojs/service',
    '@tarojs/webpack-runner',
    '@tarojs/with-weapp',
    '@tarojs/taroize',
    '@tarojs/with-weapp',
    '@tarojs/taro-h5'
  ],
  install: [
    {
      name: 'babel-preset-taro',
      version: '^3.1.1',
      dev: true
    },
    {
      name: '@tarojs/react',
      version: '^3.1.1'
    },
    {
      name: '@tarojs/runtime',
      version: '^3.1.1'
    },
    {
      name: 'react',
      version: '^16.10.0'
    },
    {
      name: 'react-dom',
      version: '^16.10.0'
    }
  ]
};
