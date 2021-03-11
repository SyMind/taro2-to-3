import React, { Component } from 'react';
import Taro from '@tarojs/taro';

class Wallace extends Component {
  componentDidMount() {
    Taro.request().then(() => {});
  }
  render() {
    return <div />;
  }
}
