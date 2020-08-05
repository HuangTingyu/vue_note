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

```js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  ......
```

#### `initProps` 

定义在 `src\core\instance\state.js`

```js
function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  .....

```

#### `initData`

`initData` 定义在 `src\core\instance\state.js`

```js
function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  ......
```

获取`vm.$options.data` 并赋值给  `vm._data`

```js
  ......
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  observe(data, true /* asRootData */) 
```

遍历所有的key，如果key名称已经在 `methods` 或者 `props` 中定义过了，那么会弹出警告。

`proxy` 定义，

```js
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

上面使用了 `proxy` 方法，把 `_data` 上的key代理到 `vm` 上面。

`observe` 定义在 `src\core\observer\index.js`

```js
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (......){
     ......
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
```

传入的 `value` 必须是对象类型，且不是能 `VNode` 实例，否则直接返回。

然后, 判断 `value` 有没有 `__ob__` 属性，如果有且 `__ob__` 属性是一个 `Observer` 实例，那么直接返回 ob

否则，走到 

```js
if(...){
	...
} else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  ...
```

这里的 `shouldObserve` 是一个全局变量

`src\core\observer\index.js`

```js
export let shouldObserve: boolean = true
```

此外定义了 `toggleObserving` 方法，用来改变 `shouldObserve`

 `src\core\observer\index.js`

```js
export function toggleObserving (value: boolean) {
  shouldObserve = value
}
```

满足 `shouldObserve` 为 `true` , 并且不是 `SSR` , 

进一步判断 `value` 是数组或者对象，并且可扩展，且不是 `Vue` 实例，此时可以进入

```
ob = new Observer(value)
```

####  `Observer` 对象

`src\core\observer\index.js`

```js
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    .....
  }
```

`def` 方法定义在 

`src\core\util\lang.js`

```js
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```

