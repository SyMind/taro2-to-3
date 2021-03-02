import Taro, { getCurrentInstance } from '@tarojs/taro';

function Foo() {
    const router = getCurrentInstance().router;
}

function Bar() {
    const router = Taro.getCurrentInstance().router;
}
