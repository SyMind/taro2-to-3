import React, { Component } from 'react';
import Taro from '@tarojs/taro';

class Wallace extends Component {
    componentDidMount() {
        const a = React.createRef();
        Taro.request().then(() => {});
    }
    render() {
        return <div />;
    }
}
