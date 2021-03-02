import Taro, { useRouter } from '@tarojs/taro';

function Foo() {
    const router = useRouter();
}

function Bar() {
    const router = Taro.useRouter();
}
