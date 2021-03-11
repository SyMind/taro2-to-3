import Taro, { getCurrentInstance } from '@tarojs/taro';

class Foo extends Taro.Component {
  $instance = getCurrentInstance();
  componentWillMount() {
    console.log(this.$instance.router);
  }
}
