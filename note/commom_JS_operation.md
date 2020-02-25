## JS常用操作

用于记录，阅读源码过程中，常用的JS操作。

### 1.数组扁平化

```js
export function simpleNormalizeChildren (children: any) {
  for (let i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}
```

