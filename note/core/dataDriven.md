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

