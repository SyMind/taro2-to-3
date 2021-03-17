import { useMemo } from 'react';
import Taro, { getCurrentInstance } from '@tarojs/taro';

function Foo() {
  const $instance = useMemo(getCurrentInstance, []);
  const router = $instance.router;
  const router2 = $instance.router;
}
