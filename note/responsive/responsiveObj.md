## 响应式对象

1. 了解什么是响应式对象
2. 了解响应式对象的创建过程

### 简要分析

1. 响应式对象

   简单来说，对象只要拥有`getter` 和 `setter` 方法，就称之为响应式对象

2. `Vue` 响应式对象创建过程，就是给props或者data赋上getter和setter方法

### 测试用例

`App.vue`

```vue
template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <HelloWorld :msg="message"/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'app',
  components: {
    HelloWorld
  },
  data:function() {
    return {
      message:'dilraba'
    };
  }
}
</script>
```

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
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}
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

上面使用了 `proxy` 方法，把 `vm._data` 上的key代理到 `vm` 上面。

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

到此为止，value是一个对象，对象结构如下

```js
{ message: 'dilraba' }
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
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
```

#### `def` 方法

定义在 

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

def 是对 `Object.defineProperty` 方法进行封装，此处的 `enumerable` 不传就是undefined，`!!undefined` 所以 `enumerable` 默认值是 false.

这里 `def(value, '__ob__', this)` 就相当于

```
value.__ob__ = this
```

此时 `value` 结构

```
value:{
	message: "dilraba"
	__ob__: {
		value: {
			message: "dilraba", __ob__: Observer
		dep: {
			id: 5
			subs: []
		vmCount: 0
	}
```

然后，判断如果 `value` 是数组，那么进入 `this.observeArray(value)` 

这个方法，就是把数组里面每个元素变成 `Observer` 对象。

`src\core\observer\index.js`

```js
 observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
```

否则，`value` 是对象那么进入 `this.walk(value)`

`src\core\observer\index.js`

```js
walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
```

#### `defineReactive`

五个参数，其中 `customSetter` 和 `shallow` 是可选的

`src\core\observer\index.js`

```js
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }
  ......
```

property —— 获取属性（obj[key]）的对应值，如果属性的 `configurable` 是false的话，那么直接返回，关于`Object.getOwnPropertyDescriptor` 可以获取到哪些属性，可以参考 Def 的定义

```js
  ......
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }
```

如果只定义了 `setter` 且只传入2个参数，就像上面 `walk` 中引用的 `defineReactive` 方法，

```js
walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
```

那么，val 就等于 `obj[key]` 

```
.......
let childOb = !shallow && observe(val)
```

如果 `obj[key]` 属性值是一个对象，那么将其转为一个 `Observer` 对象

最终，给 `obj[key]` 定义 `get` 和 `set` 方法，`get` 方法，访问 `obj[key]` 时触发， `set` 方法，定义 `obj[key]` 时触发 

```js
Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      ......
    },
    set: function reactiveSetter (newVal) {
      ......
    }
  })
```

