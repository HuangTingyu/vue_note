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

#### 1.jquery写法(详见vdom_jquery)

基本思路，修改信息的时候，清空表格dom结构，整个表格重新渲染。

