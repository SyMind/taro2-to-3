import Taro, { Component } from '@tarojs/taro';

class Foo extends Component {
  componentWillMount() {
    console.log(this.$router);
    console.log(this.$router.id);
  }
}
