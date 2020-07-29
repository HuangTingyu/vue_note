import Vue from 'vue/dist/vue.esm.js'
import App from './App.vue'

Vue.config.productionTip = false

Vue.component('app', App)
new Vue ({
  el: '#app',
  template: '<app></app>'
})
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
