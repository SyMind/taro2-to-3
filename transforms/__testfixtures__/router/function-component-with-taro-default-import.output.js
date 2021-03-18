import React from 'react';
import Taro from '@tarojs/taro';

function Foo() {
  const $instance = React.useMemo(Taro.getCurrentInstance, []);
  const router = $instance.router;
}
