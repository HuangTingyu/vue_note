## 生命周期

了解 `Vue,js` 有哪些生命周期

了解各个生命周期的执行时期，及能做的事情

### 详细分析

`src\core\instance\lifecycle.js`

```js
export function callHook (vm: Component, hook: string) {
  // #7573 disable dep collection when invoking lifecycle hooks
  ......
  const handlers = vm.$options[hook]
  const info = `${hook} hook`
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      invokeWithErrorHandling(handlers[i], vm, null, vm, info)
    }
  }
  ......
}
```

`invokeWithErrorHandling(handlers[i], vm, null, vm, info)`

最关键的一句，也就是，触发`$options` 数组里的各种钩子函数。

```js
res = args ? handler.apply(context, args) : handler.call(context)
```

### `created` 过程

`src\core\instance\init.js`

```js
	vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')
```

从上面可以看见， `beforeCreate` 和 `created` 的区别。这两个生命周期中间隔了，

```js
initInjections(vm) // resolve injections before data/props
initState(vm)
initProvide(vm) // resolve provide after data/props
```

### `mounted` 过程

`src\core\instance\lifecycle.js`

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
  ......
  callHook(vm, 'beforeMount')
```

组件挂载前，先执行 `beforeMount`。

调用 `mounted` 有两个地方 ——

1. 组件是根节点的时候，这里的 `$vnode` 代表组件的父节点，父节点不存在，代表组件是根节点。

`vue\src\core\instance\lifecycle.js`

```js
if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
```

#### 子组件 `mounted` 过程

`src\core\vdom\patch.js`

```js
return function patch (oldVnode, vnode, hydrating, removeOnly) {
  ......
  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
 }
```

`insertedVnodeQueue` 是个数组，在插入过程中会不断往里面push `VNode`

例如 ——

`src\core\vdom\patch.js`

```js
function invokeCreateHooks (vnode, insertedVnodeQueue) {
    ......
    if (isDef(i)) {
      ......
      if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
    }
  }
```

`invokeInsertHook` 定义

`src\core\vdom\patch.js`

```js
function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue
    } else {
      for (let i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i])
      }
    }
  }
```

