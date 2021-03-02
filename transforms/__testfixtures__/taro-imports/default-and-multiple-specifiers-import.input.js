import Taro, { Component } from '@tarojs/taro'

class Wallace extends Component {
    componentDidMount() {
        Taro.request().then(() => {});
    }
    render() {
        return <div />;
    }
}
