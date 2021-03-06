import { useMemo } from 'react';
import Taro, { getCurrentInstance } from '@tarojs/taro';

function Foo() {
  const $instance = useMemo(getCurrentInstance, []);
  const router = $instance.router;
}

function Bar() {
  const $instance = React.useMemo(Taro.getCurrentInstance, []);
  const router = $instance.router;
}
