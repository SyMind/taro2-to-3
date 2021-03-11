import Taro from '@tarojs/taro';

class Foo extends Taro.Component {
  componentWillMount() {
    console.log(this.$router);
  }
}
