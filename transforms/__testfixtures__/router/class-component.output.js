import Taro, { Component, getCurrentInstance } from '@tarojs/taro';

class Foo extends Component {
  $instance = getCurrentInstance();
  componentWillMount() {
    console.log(this.$instance.router);
  }
}
