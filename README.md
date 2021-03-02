# taro2-to-3

一组帮助你将 taro 2.x 项目升级到 taro 3.x 项目的 codemod 脚本集合，基于 jscodeshift 构建。

## Codemod 脚本包括

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

### `app-or-page-config`

在 Taro 2.x 中，页面/项目的配置挂载在类组件的类属性或函数式的属性上，通过 AST 分析取出来，然后生成 JSON 文件。

在 Taro 3.x 中，使用 *.config.js ，该文件和页面/项目文件在同一文件夹。

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
