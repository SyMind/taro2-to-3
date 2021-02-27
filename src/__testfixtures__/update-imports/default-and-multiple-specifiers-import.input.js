import Taro, { Component } from '@tarojs/taro'

class Wallace extends Component {
    componentDidMount() {
        const a = Taro.createRef();
        Taro.request().then(() => {});
    }
    render() {
        return <div />;
    }
}
