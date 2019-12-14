import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
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
