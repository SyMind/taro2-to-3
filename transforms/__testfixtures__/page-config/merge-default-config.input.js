export default class Index extends Component {
  config = {
    navigationBarTitleText: '首页'
  }
  render() {
    return null;
  }
}

// merge-default-config.input.config.js
/*
let config;

if (process.env.TARO_ENV === 'h5') {
  config = {
    navigationBarTitleText: 'h5'
  };
}

export default config;
*/
