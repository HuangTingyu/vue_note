## 组件化

## 1. createComponent

定义

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

#### part1 `baseCtor`

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

#### part2 `Ctor`

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
```

## 末尾: 结论

组件VNode，包含属性 `componentOptions`

`componentOptions` 相当于

```
{ Ctor, propsData, listeners, tag, children }
```

## 2.组件patch

- 组件patch整体流程
- pathch流程中的 activeInstance、vm.$vnode、vm._vnode等
- 了解嵌套组件的插入顺序

### part1

以下看的都是，跟keep-alive无关的逻辑

`src\core\vdom\patch.js`

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

```
const Sub = function VueComponent (options) {
      this._init(options)
    }
```

