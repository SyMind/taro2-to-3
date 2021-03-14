import Taro, {Component} from '@tarojs/taro';

class App extends Component {
  config = {
    pages: [
      'pages/home/home'
    ]
  }

  render() {
    return null;
  }
}

Taro.render(<App />, document.getElementById('app'));
