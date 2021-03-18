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
2. taro 内部 `__taroRouterChange` 事件参数变更，h5 中参数发生变化，小程序中不触发 https://github.com/NervJS/taro/issues/7903
3. taro 3.2.x 以上版本中 preloadData api 发生变更 https://github.com/NervJS/taro/commit/d2c4aaf5d9d755bc3ca40f9b449340b360c673d5
4. 缺失对 `this.$scope` api 进行转换 https://github.com/NervJS/taro/issues/7795

## 处理流程

1. 读取 Taro 项目中的编译配置文件 `config/index.js`.
    1. 读取其中的配置项 `sourceRoot` ，获取项目入口文件所在目录。
    2. 更新编译配置文件。
2. 读取当前项目中的入口文件，如 `{sourceRoot}/app.js`。
    1. 读取其中的配置项 `pages` ，获取项目中所有的页面路径。
    2. 更新入口文件。
3. 执行以下脚本。
4. 读取项目的 `package.json` 文件，检查并更新依赖。

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
