# vue_note
VUE学习笔记

## 1.virtual dom

virtual dom，虚拟DOM

本质是通过JS模拟DOM结构，把DOM变化的对比，放在JS层来做，提高重绘性能。

浏览器最耗费性能的是，DOM操作。对于浏览器来说，操作一次dom的速度远远比不上JS

dom表示——

```html
<ul id="list">
    <li class="item">Item 1</li>
    <li class="item">Item 2</li>
</ul>
```

vdom表示——

```js
{
    tag:'ul',
    attrs:{
        id:'list'
    },
    children:[
        {
            tag:'li',
            attrs:{
                className:'item'
            },
            children:['Item 1']
        },{
        tag:'li',
            attrs:{
            className:'item'
            },
            children:['Item2']
        }
    ]
}

```

### vdom实战

1.将数据展示成一个表格

2.随便修改一个信息，表格也跟着修改

```
[
    {
        name:'张三',
        age:'20',
        address:'北京'
    },
    {
        name:'李四',
        age:'21',
        address:'上海'
    },
    {
        name:'王五',
        age:'22',
        address:'广州'
    }
]
```

#### jquery写法(详见vdom_jquery)

基本思路，修改信息的时候，清空表格dom结构，整个表格重新渲染。

## vdom核心API

### snabbdom

引入snabbdom

```
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/snabbdom.js"></script>
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/snabbdom-class.js"></script>
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/snabbdom-props.js"></script>
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/snabbdom-style.js"></script>
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/snabbdom-eventlisteners.min.js"></script>
<script src="https://cdn.bootcss.com/snabbdom/0.7.3/h.js"></script>
```

vdom关键函数——patch函数，h函数，container

#### patch作用1 —— 生成dom结构

```js
var snabbdom = window.snabbdom

// 定义patch
var patch = snabbdom.init([
    snabbdom_class,
    snabbdom_props,
    snabbdom_style,
    snabbdom_eventlisteners
])

// 定义h
var h = snabbdom.h

var container = document.getElementById('container')

// 生成vnode
var vnode = h('ul#list', {}, [
    h('li.item', {}, 'Item 1'),
    h('li.item', {}, 'Item2')
])

// 通过patch把生成的vnode插入到container里面
patch(container, vnode)
```

#### patch作用2 —— 对比修改

```js
document.getElementById('btn-change'), addEventListener('click', function() {
    // 生成newVnode
    var newVnode = h('ul#list', {}, [
        h('li.item', {}, 'Item 1'),
        h('li.item', {}, 'Item B'),
        h('li.item', {}, 'Item 3')
    ])

    // patch的另一个用法，对比修改
    patch(vnode, newVnode)
})
```

#### vdom重写需求

详见snabbdom_demo1目录

