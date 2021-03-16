import { Config, Component } from '@tarojs/taro';

interface IndexProps {}

interface IndexState {}

export default class Index extends Component<IndexProps, IndexState> {
  config: Config = {
    navigationBarTitleText: '首页'
  }
  render() {
    return null;
  }
}
