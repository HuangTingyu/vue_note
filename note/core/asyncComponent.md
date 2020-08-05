## 异步组件

1. 了解异步组件的实现原理
2. 了解异步组件的3种实现方式

## 简要概括

1. 异步组件会和引入的文件分开打包，减少文件体积，加速首屏打包速度
2. 异步组件实现的本质是2次渲染，先渲染成注释节点，当组件加载成功后，再通过`forceRender`重新渲染。
3. 高级异步组件可以通过配置，实现 `loading` , `resolve` , `reject`, `timeout` 4种状态。

## 使用

`main.js`

```js
import Vue from 'vue/dist/vue.esm.js'
import App from './App.vue'

Vue.config.productionTip = false

Vue.component('HelloWorld', function (resolve){
  require(['./components/HelloWorld'], function (res){
    resolve(res)
  })
})

new Vue({
  render: h => h(App),
}).$mount('#app')
```

异步组件和普通组件的不同，普通组件第二个参数传入的是对象，异步组件是传入一个函数。这里使用的是全局注册，记得把 `App.vue` 中局部注册相关的代码删掉。

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

这里的 `ensureCtor` 定义在 

`src\core\vdom\helpers\resolve-async-component.js`

```js
function ensureCtor (comp: any, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}
```

无论 `comp` 是一个 es 模块，或者通过 `commonJS`  包装的模块，都会被转为一个对象，最终返回构造器。

#### `part2` 

`src\core\vdom\helpers\resolve-async-component.js`

```js
if (!sync) {
        forceRender(true)
      }
```

`forceRender` 的定义 `src\core\vdom\helpers\resolve-async-component.js`

```js
const forceRender = (renderCompleted: boolean) => {
      for (let i = 0, l = owners.length; i < l; i++) {
        (owners[i]: any).$forceUpdate()
      }
      ......
```

遍历每个 `vm` 实例，执行每个 `vm` 实例的 `$forceUpdate`

`src\core\instance\lifecycle.js`

```
Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }
```

 这里的 `vm._watcher.update()` 会触发 

`src\core\instance\lifecycle.js`

```
updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
```

也就是，这里通过调用 `$forceUpdate` 实现组件重新渲染。

上面的操作触发 `render` 方法，然后重新调用 `resolveAsyncComponent`

### `part3` 

`src\core\vdom\create-component.js`

```js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
	let asyncFactory
	if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    ......
```

进入 `src\core\vdom\helpers\resolve-async-component.js`

```js
export function resolveAsyncComponent (
  factory: Function,
  baseCtor: Class<Component>
): Class<Component> | void {
	......
	if (isDef(factory.resolved)) {
    	return factory.resolved
  	}
    .....
```

此时 `factory.resolved` 已经存在，所以直接返回。

拿到 `Ctor` 以后，后面的逻辑跟同步组件的执行逻辑一致。

### 高级异步组件

`main.js`

```js
import Vue from 'vue/dist/vue.esm.js'
import App from './App.vue'
import './components/HelloWorld'
Vue.config.productionTip = false

const LoadingComponent = {
  template: '<div>Loding</div>'
}
const ErrorComponent = {
  template: '<div>Error</div>'
} 
const AsyncComponent = () => ({
  // 需要加载的组件 (应该是一个 `Promise` 对象)
  component: import('./components/HelloWorld'),
  // 异步组件加载时使用的组件
  loading: LoadingComponent,
  // 加载失败时使用的组件
  error: ErrorComponent,
  // 展示加载时组件的延时时间。默认值是 200 (毫秒)
  delay: 200,
  // 如果提供了超时时间且组件加载也超时了，
  // 则使用加载失败时使用的组件。默认值是：`Infinity`
  timeout: 3000
})

Vue.component('HelloWorld', AsyncComponent)
```

解决错误 —— 错误 `SyntaxError: Unexpected token import`

1. 安装 `@babel/plugin-syntax-dynamic-import`
2. `babel.config.js`

```js
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    "@babel/plugin-syntax-dynamic-import"
  ]
}

```

3. `.eslintrc.js`

```
module.exports = {
    "parser": "babel-eslint",
```

### 详细分析

`src\core\vdom\helpers\resolve-async-component.js`

```js
export function resolveAsyncComponent (
  factory: Function,
  baseCtor: Class<Component>
): Class<Component> | void {
	......
	else if (isPromise(res.component)) {
        res.component.then(resolve, reject)

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor)
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor)
           if (res.delay === 0) {
            factory.loading = true
          } else {
            timerLoading = setTimeout(() => {
              timerLoading = null
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true
                forceRender(false)
              }
            }, res.delay || 200)
          }
        }
        if (isDef(res.timeout)) {
          timerTimeout = setTimeout(() => {
            timerTimeout = null
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== 'production'
                  ? `timeout (${res.timeout}ms)`
                  : null
              )
            }
          }, res.timeout)
            .....
```

`resolveAsyncComponent` 检查有没有定义 `errorComp` 组件或者 `loadingComp` 组件，有就通过构造器返回组件构造器。

如果 `delay` 为 0，那么 `factory.loading = true` ,组件最终将返回 `loadingComp`

```
......
return factory.loading
      ? factory.loadingComp
      : factory.resolved
```

如果 `delay` 不为0，进入计时器。

```js
......
timerLoading = setTimeout(() => {
              timerLoading = null
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true
                forceRender(false)
              }
            }, res.delay || 200)
```

如果此时 `resolve` 组件或者 `error` 组件还没加载好，也就是 `undefined` , 那么 `factory.loading = true` ，渲染 `loadering` 组件。

如果过了 `timeout` 还没有返回 `resolve` 组件，

```js
if (isDef(res.timeout)) {
          timerTimeout = setTimeout(() => {
            timerTimeout = null
            if (isUndef(factory.resolved)) {
              reject(
                process.env.NODE_ENV !== 'production'
                  ? `timeout (${res.timeout}ms)`
                  : null
              )
            }
          }, res.timeout)
```

`reject` 的定义

```js
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
```

如果过了 `timeout` 还没有返回 `resolve` 组件，如果定义了`errorComp` ,那么触发 `forceRender` 重新回到

`src\core\vdom\helpers\resolve-async-component.js`

```
export function resolveAsyncComponent (
  factory: Function,
  baseCtor: Class<Component>
): Class<Component> | void {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }
```

最终返回 `errorComp` 组件，以及报错信息。