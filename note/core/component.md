## 组件化

## 1. createComponent

### 总结

createComponent方法最后将返回一个VNode

### 详细分析

`src\core\vdom\create-component.js`

```js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }
```

### part1 `baseCtor`

#### 出处 

`src\core\vdom\create-component.js`

```
const baseCtor = context.$options._base
```

#### 结论 

这里的 `baseCtor` 代表 `Vue.options._base`

#### 详细分析 

`src\core\global-api\index.js`

```js
Vue.options._base = Vue
```

然后，通过 `src\core\instance\init.js` , 把Vue上的options合并到 `vm.$options` 。简单来说，就是现在的 `vm.$options._base` 就是相当于 `Vue.options._base` 。

```js
vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
```

所以，根据以下， `baseCtor ` 就相当于 `vm.$option._base`

```
const baseCtor = context.$options._base
```

### part2 `Ctor`

#### 出处 

`src\core\vdom\create-component.js`

```
if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }
```

```
 if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }
```

#### 结论

Ctor 是一个约等同于Vue的构造器。如果通过extend方法返回赋值给Ctor的不是一个函数，就会报错，组件定义有问题。

#### 详细分析

关于 `extend` 方法详见

`src\core\global-api\extend.js`

```js
 Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    const Super = this
    const SuperId = Super.cid
```

这里的Super , 代表的是Vue。

因为上面的 `baseCtor` = `Vue` , 又 `Super` = `this`, 联系上下文，调用的是Vue的extend方法，所以this指代的是Vue。

接下去，缓存优化

```js
const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }
```

接着，检验组件名称

```js
const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }
```

关于 `validateComponentName` 的定义

```js
export function validateComponentName (name: string) {
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}
```

1. 第一个 if 检查组件命名是否规范
2. 第二个 if 检查组件名，不跟html内置标签（比如head, body等）重名

最后，经过各种继承，返回构造器，构造器结构与Vue类似。

根据

```
Sub.cid = cid++
```

构造器唯一，通过cid进行区分。

### part3 installComponentHooks

#### 出处

`src\core\vdom\create-component.js`

```
installComponentHooks(data)
```

#### 定义

`src\core\vdom\create-component.js`

```js
function installComponentHooks (data: VNodeData) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}
```

 hooksToMerge是一个包含组件一系列钩子的数组。

#### 结论

`data.hook`  保存了组件的各种钩子，包括 `init`, `prepatch`, `insert`, `destroy`

定义如下 ——

`src\core\vdom\create-component.js`

```js
const hooksToMerge = Object.keys(componentVNodeHooks)
```

`componentVNodeHooks`

`src\core\vdom\create-component.js`

```js
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    ......
  },

  prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    ......
  },

  insert (vnode: MountedComponentVNode) {
    ......
  },

  destroy (vnode: MountedComponentVNode) {
  	......
  }
}
```

### part4 组件VNode

最后 `createComponent` 方法将返回一个VNode

`src\core\vdom\create-component.js`

```js
// return a placeholder vnode
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )
  .......
  return vnode
```

## 2.组件patch

- 组件patch整体流程
- pathch流程中的 activeInstance、vm.$vnode、vm._vnode等
- 了解嵌套组件的插入顺序

### 总结

1. patch 的整体流程

   createComponent -> 组件初始化 -> 组件render -> 组件patch -> createComponet -> (循环开始，直到子组件全部render完，变成VNode)

2. activeInstance 保存当前激活的vm实例（new Vue 返回的对象）；

   vm.$vnode为组件占位符VNode（也就是下一个流程将被渲染的子组件，除了$options中记录了父组件，其他属性都为undefined）; 

   vm._vnode为当前组件的渲染VNode；

3. 渲染的时候，是最外一层组件先渲染，直到最深的一层组件渲染完，再执行插入操作。
4. 插入的时候，是嵌套最深的一层子组件渲染完，插入上一层组件中，再插入上上层，插入到body中。

### 详细分析

首先从 `patch` 方法开始的地方

`src\core\vdom\patch.js`

```js
return function patch (oldVnode, vnode, hydrating, removeOnly) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []

    if (isUndef(oldVnode)) {
      ......
    } else {
        ......
        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )
```

进入 `createElm` 方法，

```
if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }
```

触发 `createComponent` 方法。

### part1 关联Vue的init流程

以下看的，都是跟keep-alive无关的逻辑

`src\core\vdom\patch.js`

这里的vnode.data包含各种hook, hook对象包含{init, prepatch, insert, destroy}

```js
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      ......
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */)
        ......
      }
```

存在init方法，进入

`src\core\vdom\create-component.js`

这里的createComponentInstanceForVnode的两个参数 ——

vnode是空对象，表示该组件的父VNode, 仅仅是个占位符VNode

activeInstance 是当前激活的Vue实例，即new Vue({...})返回的实例

```js
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
  ......
  else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
```

`src\core\vdom\create-component.js`

```js
export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  ......
  return new vnode.componentOptions.Ctor(options)
}
```

以上的 `vnode.componentOptions.Ctor(options)` , 详细可以参见上面关于createComponent的分析，简单来说，Ctor是一个构造器，

根据 `src\core\vdom\create-component.js`

```
Ctor = baseCtor.extend(Ctor)
```

`src\core\global-api\extend.js` 返回了Sub函数，也就是说，Ctor相当于Sub函数。

```
Vue.extend = function (extendOptions: Object): Function {
	.......
	return Sub
}
```

Sub函数调用的时候，会触发 `_init` 函数。

以上总结，实例化构造器，触发构造函数。

```
const Sub = function VueComponent (options) {
      this._init(options)
    }
```

### part2 init流程关联父子组件

inti是构造函数，因为上面实例化构造器触发的。

`src\core\instance\init.js`

```js
......
if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } 
```

`initInternalComponent` 定义在 `src\core\instance\init.js` ，作用是合并一些配置项。

#### initInternalComponent 

 `src\core\instance\init.js` 

```js
function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}
```

这里所做的配置，最终都绑定在vm的$options上。主要是给vm.$options赋值。

接着是 `initLifecycle(vm)`

#### initLifecycle(vm)

` src\core\instance\lifecycle.js `

```
var options = vm.$options;
let parent = options.parent
......
```

#### 解释

1.这里的vm除了`$options` ，其余属性都为空

```
$data: undefined
$props: undefined
$isServer: false
$ssrContext: undefined
_uid: 1
_isVue: true
$options: {parent: Vue, _parentVnode: VNode, propsData: undefined, _parentListeners: 		undefined, _renderChildren: undefined, …}
.......
```

2.这里的 `$options.parent` 是 `activeInstance` ，也就是APP组件被激活的Vue实例。

其中包含属性包括

```
$el: div#app,
$attrs: Object,
$listeners: Object,
$data: Object,
$props: undefined,
$isServer: false,
$ssrContext: undefined,
_uid: 0,
_isVue: true,
$options: {components: {…}, directives: {…}, filters: {…}, _base: ƒ, render: ƒ}
_renderProxy: Proxy {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …},
_self: Vue {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …},
$parent: undefined,
$root: Vue {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …},
$children: [],
$refs: {},
_watcher: Watcher {vm: Vue, deep: false, user: false, lazy: false, sync: false, …},
_inactive: null,
_vnode: {
	_vnode: VNode
	child: (...)
	tag: "vue-component-1-app"
	data: {on: undefined, hook: {
		init: ƒ init(vnode, hydrating),
		prepatch: ƒ prepatch(oldVnode, vnode),
		insert: ƒ insert(vnode),
		destroy: ƒ destroy(vnode),
	}}
	children: undefined
	......
},
.......
```

`activeInstance` 定义在 ` src\core\instance\lifecycle.js ` 全局，且在update的时候被赋值的

```js
export function lifecycleMixin (Vue: Class<Component>) {
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    ......
```

#### setActiveInstance 

定义 ——

```js
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}
```

简要概括，1.把当前vue实例赋值给 `activeInstance` 2. 把父组件赋值给 `prevActiveInstance`

————————————————————分割线————————————————————

继续看 `initLifecycle`

```js
if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  ......
```

这里的 `parent.$children.push(vm)`, push进去的，就是上面除了options以外属性全为空的vm

然后这里的`vm.$parent` , 就是实例化后的（也就是new Vue）APP组件

`src\core\instance\init.js`

`initMixin` 执行完毕后，返回子组件的实例。

也就是说，vm现在除了`$options`以外多了个新属性——`$parent` ，`$parent` 有一个`$children` 数组，数组里的元素包含 `$options` 属性。

上面是init流程，vm对象存父子关系的过程。

流程执行完，vm对象多了一个 `$parent` 存父子关系，以及 `$options` （详见 `initInternalComponent` 函数）。

### part3 patch渲染VNode

以上流程都是由 `createComponentInstanceForVnode` 带出来的，现在回到 `componentVNodeHooks` 的 init 部分。

`src\core\vdom\create-component.js`

回到 `componentVNodeHooks` 的 `init` 部分，这里的child就是part2的vm。

```js
const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
```

接着，调用子组件的 `$mount` 方法

```
child.$mount(hydrating ? vnode.elm : undefined, hydrating)
```

这里的 `hydrating` 是false

所以上面的语句等同于

```
child.$mount(undefined, hydrating)
```

`$mount` 的定义在 ——

`src\platforms\web\runtime\index.js` , 这里的el 传的是undefined

```js
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

`src\core\instance\lifecycle.js`

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
 if(......){
 	.......
 }
 else{
 	updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
 }
 
```

此处，render函数生成渲染VNode, 然后执行 `_update` 方法做patch。

#### render函数

`src\core\instance\render.js`

```js
Vue.prototype._render = function (): VNode {
    const vm: Component = this
    const { render, _parentVnode } = vm.$options
    
    ......

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    ......
```

上面的 `$vnode` 是一个占位符节点，其实也就是组件App的子组件HelloWorld的占位符。

部分属性如下，

```js
child: VueComponent
tag: "vue-component-1-app"
data: {on: undefined, hook: {…}}
children: undefined
text: undefined
elm: undefined
ns: undefined
context: Vue {_uid: 0, _isVue: true, $options: {…}, _renderProxy: Proxy, _self: Vue, …}
fnContext: undefined
fnOptions: undefined
fnScopeId: undefined
.......
```

然后，

```
let vnode
try {
      // There's no need to maintain a stack becaues all render fns are called
      // separately from one another. Nested component's render fns are called
      // when parent component is patched.
      ......
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
    	......
    }
    ......
    vnode.parent = _parentVnode
```

这里的`render.call`生成了一个渲染VNode，然后又把占位符 `_parentVnode` 赋值给 `vnode.parent`

#### update方法子组件patch

`src\core\instance\lifecycle.js`

```js
updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
```

_update的定义在

`src\core\instance\lifecycle.js`

```
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } .......
```

也就是说，这里的 `_vnode` 是刚刚在`vm._render()` 生成的渲染VNode。

经过 ` setActiveInstance(vm)` , `activeInstance` 变成刚刚的子组件。

这个`_update` 函数实际上刚刚经历过，再接下去就是又重复part2相关的过程，直到把所有子组件遍历完。

#### patch方法

接着 `src\core\instance\lifecycle.js`

```
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
```

回到 part1 的 `node_modules\vue\src\core\vdom\patch.js`

上面传入的 `$el` 是undefined，这里的vnode是上边生成的渲染VNode

```
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
```

所以看到

```js
if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } 
```

`src\core\vdom\patch.js` , 下面的parentElm是空值

```js
function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
```

如果子组件是一个组件的话，那么看到下面

```
if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }
```

`node_modules\vue\src\core\vdom\patch.js`

```
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    let i = vnode.data
    if (isDef(i)) {
      .......
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue)
        }
     }
```

`node_modules\vue\src\core\vdom\patch.js`

```js
function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
      vnode.data.pendingInsert = null
    }
    vnode.elm = vnode.componentInstance.$el
    .......
}
```

上面的 `vnode.componentInstance.$el` 是一个DOM节点

```
        insert(parentElm, vnode.elm, refElm)
```

这里的`insert` 就是把组件DOM节点插入到父节点(如果是第一次执行patch函数，那么此处的父节点应该是body)中。整个插入顺序是先子后父，父组件只是先标一个占位符。