## 数据驱动

应用举例

```
import Vue from 'vue'

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
```

上面涉及的源码

`vue-dev\src\core\instance\init.js`

Vue本质是一个工厂模式`function` ，`vm.$options` 就是上面传入的类，`vm.$options.el` 就可以读取我们传入的`el` 。`el` 最后会传给 `$mount` 做挂载。

```
if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
```

### 初始化的过程

#### 问题1：访问data里的数据是如何实现的？

为什么mouted里面，可以通过 `this.message` 访问到 `data`中定义的`message` 。

```
mounted(){
    console.log(this.message)
  },
  data:function() {
    return {
      message:'bacra'
    };
  }
```

#### 简要总结

主要是通过 `Object.defineProperty` ，在我们访问 `this.message` 的时候，返回我们在 `data` 中定义的 `message` 。

代码出处位于 —— `node_modules\vue\src\core\instance\stat.js`

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

#### 详细逻辑

通过项目的 `node_modules\vue\src\core\instance\init.js` ，找到 `state.js` ，里面的 `initData` 

```javascript
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
```

然后，这里面就是，先把 `data` ，赋值给`this._data` 

```
proxy(vm, `_data`, key)
```

再通过 `Object.defineProperty` 做一层转换，也就是在我们访问 `this.message` 的时候，返回 `this._data.message`

#### 问题2：执行mount方法发生了哪些事情？

#### 简要总结

主线，位于`vue-dev\src\core\instance\lifecycle.js` ，主要搜索 `updateComponent`

1. 判断 `el` 对应的节点，例如`#app` 是否存在
2. 实例化出一个渲染 `watcher`

#### 详细逻辑

如果找不到 `el`  定义的节点，就报错，返回空div。（这里`query` 函数的定义详见 `node_modules\vue\src\platforms\web\util\index.js`）

```js
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating)
};
```

确认 `el` 存在以后，判断有没有 `render` 函数，如果不存在，把模板或者`el` 里面的东西，例如`{{message}}` 转成 `render` 函数。

```js
 if (!options.render) {
    let template = options.template
    if (template) {
    	...
    } else if (el) {
      template = getOuterHTML(el)
    }
```

然后来到 `node_modules\vue\src\core\instance\lifecycle.js`

创建了一个渲染 `watcher`

```js
new Watcher(vm, updateComponent, noop, {
    before () {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }, true /* isRenderWatcher */)
```

updateComponent定义如下

```js
updateComponent = () => {
      vm._update(vm._render(), hydrating)
}
```

此后无论视图更新，还是什么，都走 `vm._update`

#### 问题3：`render` 函数是做什么的？

#### 简要回答

主要作用是，把实例渲染成一个虚拟Node并返回

#### 出处

render函数的调用始于`vue-dev\src\core\instance\lifecycle.js` 

```js
updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
```

#### 应用

在vue项目的 `main.js` 写入

```js
import Vue from 'vue'
new Vue({
  el:'#app',
  render(createElement){
    return createElement('div',{
      attrs:{
        id:'#app1'
      }
    },this.message)
  },
  data(){
    return {
      message : 'bacra'
    }
  }
})
```

页面上出现 `bacra`

上面的代码相当于

```html
<div id="app1">
	｛｛message｝｝
</div>
```

#### 详细逻辑

render函数可以用户自己写，也可以通过编译生成。

主要逻辑见 `node_modules\vue\src\core\instance\render.js` ，此处可见 `render` 最后返回是 `VNode`

```
Vue.prototype._render = function (): VNode 
```

vnode的生成，主要参见下面，

```
vnode = render.call(vm._renderProxy, vm.$createElement)
```

(1)此处的 `vm._renderProxy` ，如果是生产环境(`process.env.NODE_ENV === 'production'`)，`vm._renderProxy` 指的就是 `vm` 。

```
if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
```

如果是开发环境，那就走 `initProxy(vm)` ，这个函数主要是做一些检查，例如

```js
const hasHandler = {
    has (target, key) {
      const has = key in target
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      if (!has && !isAllowed) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }
```

这里面做了一个遍历，如果我们在 `template` 里面使用了未定义的变量，就会执行 `warnNonPresent` ，也就是会报下面的错误，主要就是说 `xxx` 没有定义。

```js
const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }
```

(2)`$createElement` ，详细见 `render.js` 里面的 `initRender` 函数

```js
 vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
 vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```

这个，`_c` 是被编译的 `render` 函数使用的方法，而 `$createElemen` 是手写render函数使用的。

(3)检查，只能存在一个vnode，如果存在多个vnode，就会报错 `Multiple root nodes .......`

```js
 if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnod
```

#### 问题4：`vnode` 是什么？

#### 简要解答

虚拟dom

#### 详细解答

`node_modules\vue\src\core\vdom\vnode.js` 有详细定义

```
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node
```

里面没见过的类型，例如 `VNodeData` ，可以在vue源码flow文件夹下面 `vue-dev\flow\vnode.js` 找到定义

```
declare interface VNodeData {
  key?: string | number;
  slot?: string;
  ref?: string;
  is?: string;
  pre?: boolean;
  tag?: string;
  staticClass?: string;
```

`vue` 里面的虚拟 `dom` 主要借鉴了`snabbdom`

#### 问题5：`createElement` 都做了什么？

#### 简要解答

`createElemnt` 是`render` 函数的本质。

1.首先，把子节点，变成只有一层且元素全为`vnode` 的数组

2.创建并返回vnode

#### 出处

`vue-dev\src\core\instance\render.js`

```js
vnode = render.call(vm._renderProxy, vm.$createElement)
```

所以，`createElemnt` 的作用 `render` 函数的返回值，也就是`render` 函数的本质。

#### 详细解答

#### 1.子节点数组扁平化

`vue-dev\src\core\vdom\create-element.js`

```js
export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
```

参数详解 ——

`context` —— vm实例; 

`tag` , `data` ——`vnode` 的 `tag` 和 `data` ;

`children` —— 子节点，用于构造`vnode` 树映射到 `dom` 树;

这里做了一次，参数的重载，当缺少参数`data` 的时候，后面的参数都往前移动。

```js
if (Array.isArray(data) || isPrimitive(data)) {
  // 这个判断条件，实际上是，当我们缺少data，在data的位置传了children的时候，自动把参数都往前移
  // 
    normalizationType = children
    children = data
    data = undefined
  }
```

`normalizationType` —— 两个选项，1是`SIMPLE_NORMALIZE` ，2是`ALWAYS_NORMALIZE`

这些处理完毕后会调用 `_createElement`

```js
return _createElement(context, tag, data, children, normalizationType)
```

接下来，判断`normalizationType`

```js
if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
```

1.`normalizationType` 是`SIMPLE_NORMALIZE`

如果`children` 是个嵌套数组，会执行一个拍平操作，也就是`simpleNormalizeChildren` ，返回一个一维数组。

2.`normalizationType` 是`ALWAYS_NORMALIZE`

类型判断，首先判断`children` 是不是文本类型的`vnode`

如果是，就返回`[createTextVNode(children)]` ，`createTextVNode` 也就是实例化了一个`vnode`

`vue-dev\src\core\vdom\create-element.js`

```js
export function normalizeChildren (children: any): ?Array<VNode> {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}
```

如果`children` 是一个`array` ，那么走`normalizeArrayChildren` ，本质就是如果发现多层数组，就递归调用`normalizeArrayChildren`。把多层数组，变成一层数组(里面所有的元素都是vnode)

```
if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, `${nestedIndex || ''}_${i}`
```

#### 2.创建相应的`vnode`

`vue-dev\src\core\vdom\create-element.js`

```js
  if (typeof tag === 'string') {
    let Ctor
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
    if (config.isReservedTag(tag)) {
      ...
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
     ...
    } else {
     ...
    }
  } else {
   ...
  }
```

第一层判断，`tag` 是`string` 还是组件，组件走`createComponent`

第二层判断，当`tag` 是`string` ，

判断`tag` 是属于下面哪一种，做对应的处理，创建不同的`vnode`

1.`html` 保留标签， 

```
if (config.isReservedTag(tag)) 
```

2.组件

```
else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag)))
```

3.不认识的节点



