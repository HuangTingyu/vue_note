## 合并配置

- 了解外部调用场景的配置合并
- 了解组件场景的配置合并

### 调试代码

`main.js` 文件改成下面这样

```js
import Vue from 'vue/dist/vue.esm.js'

Vue.config.productionTip = false

let childComp = {
  template: '<div>{{msg}}</div>',
  created () {
    console.log('child created')
  },
  mounted () {
    console.log('child mounted')
  },
  data () {
    return {
      msg: 'Hello dilraba'
    }
  }
}

Vue.mixin({
  created () {
    console.log('parent created')
  }
})

new Vue ({
  el:'#app', 
  render: h => h(childComp)
})
```

### 详细分析

`src\core\instance\init.js`

```js
export function initMixin (Vue: Class<Component>) {
	......
	if (options && options._isComponent) {
      ......
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
```

第一个参数，`Vue.options` 

以下的操作，都是为了给 `Vue.options` 添加配置

1. `src\core\global-api\index.js`

```js
Vue.options = Object.create(null)
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

Vue.options._base = Vue

// extend的是为了给Vue.options做一些参数扩展
extend(Vue.options.components, builtInComponents)
```

2. `vue\src\core\global-api\mixin.js`

```js
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```



#### `mergeOptions` 定义

在 `src\core\util\options.js`

```js
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  ......

  const options = {}
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

#### 返回结果

返回的options是一个由各种function组成的数组。

以下是对于 `options` 组成结构的分析

### 生命周期的配置合并

#### `strats` 的定义

`src\core\util\options.js`

```js
LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})
```

关于 `LIFECYCLE_HOOKS` 的定义

`src\shared\constants.js`

```js
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
```

#### `mergeHook` 定义

`node_modules\vue\src\core\util\options.js`

```js
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal? parentVal? parentVal.concat(childVal): Array.isArray(childVal)? childVal: [childVal]: parentVal
  return res? dedupeHooks(res): res
}
```

1. 参数 `parentVal` 数组

2. 参数 `childVal` `function` 或者 数组
3. 返回是数组 `?Array<Function>`

解释一下上面那一坨长长的问号

```
const res = childVal? parentVal? parentVal.concat(childVal): Array.isArray(childVal)? childVal: [childVal]: parentVal
```

1. 首先，看 `childVal` 定义，没有定义，返回最后的 `parentVal`

```
childVal? (parentVal? ......): parentVal
```

2. `childVal` 有定义，看上面括号中的 `parentVal` 是否定义

```js
parentVal? parentVal.concat(childVal): (Array.isArray(childVal)?......)
```

有定义，执行 `parentVal.concat(childVal)`

3. 没有定义，查看 `childVal` 是否是Array，是返回 `childVal` ，否返回 `[childVal]`

```
Array.isArray(childVal)? childVal: [childVal]
```

