import React from 'react';
import Taro, { getCurrentInstance } from '@tarojs/taro';

function Foo() {
  const $instance = React.useMemo(Taro.getCurrentInstance, []);
  const router = $instance.router;
}
