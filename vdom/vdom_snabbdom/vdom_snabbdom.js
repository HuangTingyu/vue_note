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
    h('li.item', {}, 'Item 2')
])

patch(container, vnode)

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