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

### `mixin`

`vue\src\core\global-api\mixin.js`

```js
export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

### 分析

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

`mergeOptions` 定义在 

