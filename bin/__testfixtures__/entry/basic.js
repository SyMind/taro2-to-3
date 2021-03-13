import Taro, {Component} from '@tarojs/taro';

class App extends Component {
  config = {
    pages: [
      'pages/home/home'
    ]
  }
}

Taro.render(<App />, document.getElementById('app'));
