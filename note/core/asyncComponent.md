## 异步组件

1. 了解异步组件的实现原理
2. 了解异步组件的3种实现方式

## 使用

`main.js`

```js
Vue.component('HelloWorld', function (resolve, reject){
  // require 语法告诉 webpack
  // 自动将编译后的代码分割成不同的块
  require(['./components/HelloWorld'], function (res){
    resolve(res)
  })
})

new Vue({
  render: h => h(App),
}).$mount('#app')
```

异步组件和普通组件的不同，普通组件第二个参数传入的是对象，异步组件是传入一个函数。

## 详细分析

`src\core\global-api\assets.js`

```js
ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      	......
        this.options[type + 's'][id] = definition
        return definition
```



`src\core\vdom\create-component.js`

```js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  ......
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
  .....
```

对于 `resolveAsyncComponent` 的定义如下

`src\core\vdom\helpers\resolve-async-component.js`

```js
export function resolveAsyncComponent (
  factory: Function,
  baseCtor: Class<Component>
): Class<Component> | void {
	......
	const resolve = once((res: Object | Class<Component>) => {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor)
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender(true)
      } else {
        owners.length = 0
      }
    })

    const reject = once(reason => {
      process.env.NODE_ENV !== 'production' && warn(
        `Failed to resolve async component: ${String(factory)}` +
        (reason ? `\nReason: ${reason}` : '')
      )
      if (isDef(factory.errorComp)) {
        factory.error = true
        forceRender(true)
      }
    })

    const res = factory(resolve, reject)
    ......
```

这里的 `once` 保证函数只被执行一次，具体定义

`src\shared\util.js`

```js
export function once (fn: Function): Function {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments)
    }
  }
}
```

#### `part2`

`src\core\vdom\helpers\resolve-async-component.js`



