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

