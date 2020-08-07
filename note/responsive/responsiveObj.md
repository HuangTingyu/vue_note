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

## 依赖收集

1. 了解什么是依赖收集
2. 了解依赖收集的流程及目的

### 简要分析

简要分析

### 详细分析

#### 渲染watcher

`src\core\observer\watcher.js`

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
......
if(...){
   .....
   }
else {
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
}
new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
  hydrating = false
```

此处的实例化的 `watcher` 对象定义在 

`src\core\observer\watcher.js`

```js
export default class Watcher {
  vm: Component;
  expression: string;
  .....
constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
) {
	if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      ......
    }
this.value = this.lazy? undefined : this.get()
```

此处传入的 `updateComponent` 是一个函数，

然后，执行 `this.get()` 

```js
get () {
    pushTarget(this)
    	......
    }
```

`pushTarget` 方法定义在

`src\core\observer\watcher.js`

```js
const targetStack = []
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
```

这里的 `pushTarget` 方法，把上面传入的 `this` ，也就是 `watcher` 对象赋值给 `Dep.target` ,

如果 `Dep.target` 已经存在，那么会把已存在的 `Dep.target` 推到 `targetStack` 中，再赋值。

- 设计这个过程的原因

可以联系到父子组件的创建，首先会先执行父组件的 `mount` 过程，那么执行字组件 `mount` 过程时，就会把父组件先 暂存到 `targetStack` 中。

接着,

```js
get () {
	.....
	let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
    .....
```

执行 `value = this.getter.call(vm, vm)`

就是执行 `vm._render()`

`src\core\instance\lifecycle.js`

```
vm._update(vm._render(), hydrating)
```

`render` 函数定义在 `src\core\instance\render.js`

```
  Vue.prototype._render = function (): VNode {
  ......
  try {
      // There's no need to maintain a stack becaues all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      currentRenderingInstance = vm
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } 
```

这里的 `render.call(vm._renderProxy, vm.$createElement)` 会触发

`src\core\observer\index.js` 中的 `get` 方法

```js
Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        .....
```

#### `Dep` 对象

关于 `Dep` 对象，定义在 `src\core\observer\dep.js` ，主要作用，搭建属性和 `Watcher` 对象的联系。

这里的 `Dep.target` 是一个 `watcher` 对象，如果 `Dep.target` 存在，那么 `dep.depend()`

```js
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }
```

`dep.depend()`  调用的 `Dep.target.addDep(this)` 定义在

`src\core\observer\watcher.js`

```js
addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      ......
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }
```

这里的 `newDepIds` 和 `depIds` 是定义在 `src\core\observer\watcher.js` `watcher` 对象中的

如果这两个数组中都找不到 `dep.id` ，那么就会触发 `src\core\observer\dep.js` 的 `addSub`

```js
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }
addSub (sub: Watcher) {
    this.subs.push(sub)
  }
```

这个 `watcher` 最终被推到 `subs` 里面，也就成了这个数据的订阅者。

#### 渲染watcher

####  `part2` 

重新回到上面的渲染 `Watcher` 的 `get` 方法

```
try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      ......
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
```

`popTarget` 定义 `src\core\observer\dep.js`

```js
export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

重新从 `targetStack` 取出旧的target

然后 ，执行 `cleanupDeps` , 清除 `addDep` 刚刚添加的依赖。

`src\core\observer\watcher.js`

```js
cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }
```

