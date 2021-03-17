import React, { useMemo } from 'react';
import { getCurrentInstance } from '@tarojs/taro';

function Foo() {
  const $instance = useMemo(getCurrentInstance, []);
  const router = $instance.router;
}
