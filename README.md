# taro2-to-3（beta）

帮助你将 taro 2.x 项目升级到 taro 3.x 项目，基于 jscodeshift 构建。

## 动机

愿将 taro 2.x 项目升级到 taro 3.x 项目的过程变得轻松愉悦。

## 使用

在运行前，请先提交你的本地代码修改。

```bash
# 全局安装
npm i -g taro2-to-3
# or for yarn user
#  yarn global add taro2-to-3
taro2-to-3
```

## 计划

1. 3-14 日前完成 TODO 列表中的左右的所有功能，发布 beta 版本；
2. 3-20 日前发布正式版本，并发布到 taro 物料中心。

已知问题：

1. h5 Taro.pxTransform https://github.com/NervJS/taro/issues/8896
2. 函数式组件中 router api 转换使用 useMemo 进行缓存优化
3. 存在 `const enum` 时增加相应的 babel 插件进行处理
4. taro 内部 `__taroRouterChange` 事件参数变更
5. taro 3.2.x 以上版本中 preloadData api 发生变更

## 脚本包括

### `taro-imports`

在 Taro 2.x 中，所有面向应用开发者的 API 都在 @tarojs/taro 包中。

在 Taro 3.x 中，将 React 的 API 从 react 包中引入，其它的 API 仍然从 @tarojs/taro 引入。

```diff
- import Taro, { Component } from '@tarojs/taro';
+ import React, { Component } from '@tarojs/taro';
+ import Taro from '@tarojs/taro';

class Wallace extends Component {
    componentDidMount() {
        Taro.request().then(() => {});
    }
    render() {
        return <div />;
    }
}
```

### `page-config`

在 Taro 2.x 中，页面的配置挂载在类组件的类属性或函数式的属性上，通过 AST 分析取出来，然后生成 JSON 文件。

在 Taro 3.x 中，使用 *.config.js ，该文件和页面文件在同一文件夹。

```diff
// foo.jsx
export default class Index extends Component {
-   config = {
-       navigationBarTitleText: '首页'
-   }
    render() {
        return null;
    }
}

+// foo.config.js
+export default config = {
+   navigationBarTitleText: '首页'
+};
```

### `router`

在 Taro 2.x 中，通过 this.$router 访问当前组件/页面路由的详情。

在 Taro 3.x 等价的 API 是 @tarojs/taro 包中的 getCurrentInstance().router。

```diff
class Foo extends Component {
+   $instance = getCurrentInstance();
    componentWillMount() {
-       console.log(this.$router);
+       console.log(this.$instance.router)
    }
}
```
