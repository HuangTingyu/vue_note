## 响应式对象

1. 了解什么是响应式对象
2. 了解响应式对象的创建过程

### 简要分析

简要分析

### 详细分析

`src\core\instance\init.js`

```js
export function initMixin (Vue: Class<Component>) {
	......
    initState(vm)
    .....
```

`initState` 主要用来初始化 `props` , `data` , `methods` 之类的方法 

`initState` 定义在 `src\core\instance\state.js`

