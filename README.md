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

```js
h('<标签名>', { 属性 }, [{ 子元素1 }, { 子元素2 }, ...])
h('<标签名>', { 属性 }, '子元素')
patch(container,vnode)
patch(vnode,newVnode)
```

### diff算法

diff算法核心应用，把vdom转换为真实dom节点。

核心应用——

1. patch(container,vnode)
2. patch(vnode,newVnode)

#### 1.vnode生成新dom节点

详细参考vdom_diff目录下的 `createElement.js`

`createElemnt` 产生真实dom节点主要实现——

```js
function createElement(vnode) {
	// 创建真实的dom元素
	var elem = document.createElement(tag)
	// 返回真实dom元素
	return elem
}
```

添加属性——遍历attrs对象

添加子元素——遍历children数组，递归调用createElement

```js
function createElement(vnode) {
  	......
	// 属性
    var attrName
    for (attrName in attrs) {
        if (attrs.hasOwnProperty(attrName)) {
            // 给elem添加属性
            elem.setAttribute(attrName, attrs[attrName])
        }
    }
    // 子元素
    children.forEach(function(childVnode) {
        // 给elem添加子元素
        elem.appendChild(createElement(childVnode)) //递归

    })
}
```

#### 2.vnode对比修改dom节点

详细参考vdom_diff目录下的 `updateElement.js`

1.对于tag相同的节点——

递归对比，新子节点，旧子节点

```js
function updateChildren(vnode, newVnode) {
	children.forEach(function(childVnode, index) {
        var newChildVnode = newChildren[index]
        if (childVnode.tag === newChildVnode.tag) {
            // 深层次对比，递归
            updateChildren(childVnode, newChildVnode)
        } 
      ...
    })
}
```

2.对于tag不同的节点——

```js
function updateChildren(vnode, newVnode) {
  if{
    ...
  }
  else {
     // 替换
     replaceNode(childVnode, newChildVnode)
   }
}
function replaceNode(vnode, newVnode) {
    var elem = vnode.elem // 真实的dom节点
    var newElem = createElement(newVnode)

    //替换
}
```

3.除了上述两个点以外，没有涉及的点——

- 节点新增和删除
- 节点重新排序
- 节点属性、样式、事件绑定
- 极致的压榨性能

4.总结

diff算法，linux的基础命令