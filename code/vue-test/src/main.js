import Vue from 'vue/dist/vue.esm.js'
import App from './App.vue'
import './components/HelloWorld'
Vue.config.productionTip = false

// Vue.component('HelloWorld', function (resolve){
//   require(['./components/HelloWorld'], function (res){
//     resolve(res)
//   })
// })
// const LoadingComponent = {
//   template: '<div>Loding</div>'
// }
// const ErrorComponent = {
//   template: '<div>Error</div>'
// } 
// const AsyncComponent = () => ({
//   // 需要加载的组件 (应该是一个 `Promise` 对象)
//   component: import('./components/HelloWorld'),
//   // 异步组件加载时使用的组件
//   loading: LoadingComponent,
//   // 加载失败时使用的组件
//   error: ErrorComponent,
//   // 展示加载时组件的延时时间。默认值是 200 (毫秒)
//   delay: 200,
//   // 如果提供了超时时间且组件加载也超时了，
//   // 则使用加载失败时使用的组件。默认值是：`Infinity`
//   timeout: 3000
// })

// Vue.component('HelloWorld', AsyncComponent)

new Vue({
  render: h => h(App),
}).$mount('#app')
// Vue.component('app', App)
// new Vue ({
//   el: '#app',
//   template: '<app></app>'
// })
// let childComp = {
//   template: '<div>{{msg}}</div>',
//   created () {
//     console.log('child created')
//   },
//   mounted () {
//     console.log('child mounted')
//   },
//   data () {
//     return {
//       msg: 'Hello dilraba'
//     }
//   }
// }

// Vue.mixin({
//   created () {
//     console.log('parent created')
//   }
// })

// new Vue ({
//   el:'#app', 
//   render: h => h(childComp)
// })

// 引入APP组件
// new Vue({
//   render: h => h(App),
// }).$mount('#app')



// new Vue({
//   el:'#app',
//   render(createElement){
//     return createElement('div',{
//       attrs:{
//         id:'#app1'
//       }
//     },this.message)
//   },
//   data(){
//     return {
//       message : 'bacra'
//     }
//   }
// })
