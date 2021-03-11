import Taro, { Component, getCurrentInstance } from '@tarojs/taro';

class Foo1 extends Component {
  $instance = getCurrentInstance();
  componentWillMount() {
    console.log(this.$instance.router);
  }
}

function Foo2() {
  const router = getCurrentInstance().router;
}
