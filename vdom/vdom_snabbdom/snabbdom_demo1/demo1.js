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

var data = [{
        name: '张三',
        age: '20',
        address: '北京'
    },
    {
        name: '李四',
        age: '21',
        address: '上海'
    },
    {
        name: '王五',
        age: '22',
        address: '广州'
    }
]

// 把表头也放在data中
data.unshift({
    name: '姓名',
    age: '年龄',
    address: '地址'
})

var container = document.getElementById('container')

var vnode
    //渲染函数
function render(data) {
    // data.map返回一个数组
    var newVnode = h('table', {}, data.map(function(item) {
        var tds = []
        var i
        for (i in item) {
            if (item.hasOwnProperty(i)) {
                tds.push(h('td', {}, item[i] + ''))
            }
        }
        return h('tr', {}, tds)
    }))
    if (vnode) {
        // re-render
        patch(vnode, newVnode)
    } else {
        // 初次渲染
        patch(container, newVnode)
    }

    // 存储当前vnode结果，不然vnode永远是空的
    vnode = newVnode
}

//初次渲染
render(data)
var btnChange = document.getElementById('btn-change')
btnChange.addEventListener('click', function() {

    data[1].age = 30
    data[2].address = '深圳'

    // re-render
    render(data)
})