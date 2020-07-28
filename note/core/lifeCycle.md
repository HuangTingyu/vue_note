## 生命周期

了解 `Vue,js` 有哪些生命周期

了解各个生命周期的执行时期，及能做的事情

### 简要总结

1. `Vue.js` 生命周期函数，初始化及数据更新过程各个阶段执行不同的钩子函数
2. 在 `created` 钩子函数中，可以访问到数据
3. 在 `mounted` 钩子函数中，可以访问到DOM
4. 在 `destroyed` 钩子函数中，可以做一些定时器的销毁工作

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

这里的 `insert` 定义在

`src\core\vdom\create-component.js`

```js
insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    .....
```

简单来说，就是看该组件实例是否 `_isMounted` ，否的话调用 `callHook` 进行渲染。

因为插入的时候，是先插入最里层的子组件，所以，子组件的 `mounted` 先于父组件的 `mounted` 。

###  `update` 过程

#### `beforeUpdate` 触发是在

`src\core\observer\scheduler.js`

```js
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    ......
```

如果 `watcher` 有定义 `before` ，那么就执行 `watcher.before()`

#### `update` 的触发

`src\core\observer\scheduler.js`

```js
  const updatedQueue = queue.slice()
  ......
  callUpdatedHooks(updatedQueue)
  function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
      callHook(vm, 'updated')
    }
  }
}
```

`updatedQueue` 是个不断添加的数组。

`callUpdatedHooks` 判断了 `watcher` 是不是渲染 `watcher`，如果是渲染 `watcher` 并且 `_isMounted` 为 `true` ,也就是组件已经渲染过的话，那么就执行 `updated` 过程。

### `destroy` 过程

`src\core\instance\lifecycle.js`

```js
Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    ......
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    callHook(vm, 'destroyed')
```

destroy 的时候，通过往 `patch` 方法传入参数 `null` ，实现递归销毁子组件。