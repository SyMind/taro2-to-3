import React from 'react';
import { getCurrentInstance } from '@tarojs/taro';

function Foo() {
  const router = getCurrentInstance().router;
}
