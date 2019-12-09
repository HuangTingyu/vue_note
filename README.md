## 知识结构

- 核心(note/core)
  - 数据驱动(dataDriven.md)
  - 组件化
  - 响应式原理
- 编译
  - parse
  - optimize
  - codegen
- 扩展
  - event、v-model
  - slot、keep-alive
  - transition
  - ......
- 生态
  - Vue-Router
  - Vuex

## Vue目录分析

Vue.js的源码都在src目录下，目录如下——

- src(根目录)
- src/compiler(编译相关)
- src/core(核心代码)
- src/platforms(不同平台的支持)
- src/server(服务端渲染)
- src/sfc(.vue文件解析)
- src/shared(共享代码)

## 测试目录(vue-test)

启动项目 

```
npm run serve
```

## 调试源码技巧汇总

先用 `vue-cli` 搭建好项目环境，找到项目里面的 `node_modules\vue` 

`package.json` 找到这一行

```
"module": "dist/vue.runtime.esm.js",
```

然后项目启动以后，直接进 `node_modules\vue\dist\vue.runtime.esm.js`  加入`debugger` 就完事。

