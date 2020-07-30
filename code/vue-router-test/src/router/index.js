import Vue from 'vue'
import VueRouter from 'vue-router'
import Bar from '../components/bar.vue'
import Foo from '../components/foo.vue'
Vue.use(VueRouter)


const routes = [
    {path:'/', component: Foo},
    {path:'/bar', component: Bar}, 
]
export const Router = new VueRouter({
    routes
})

