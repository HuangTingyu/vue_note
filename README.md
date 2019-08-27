# vue_note
VUE学习笔记

## 1.virtual dom

virtual dom，虚拟DOM

本质是通过JS模拟DOM结构，提高重绘性能。

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

