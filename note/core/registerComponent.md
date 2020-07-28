## 组件注册

组件注册的2种方式 —— 全局注册，局部注册

了解2种注册方式的差异

### 简要总结

局部注册组件只能在当前组件中使用，因为它的扩展是扩展在 `Sub.options`

全局注册是扩展到 `Vue.options`

### 详细分析

### 全局注册

#### ASSET_TYPES

`ASSET_TYPES` 是一个数组，定义在 `src\shared\constants.js`

```js
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
```

此处只看 `component` , 以下的type都当作component处理。

`src\core\global-api\assets.js`

```js
export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
ASSET_TYPES.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        ......
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id
          definition = this.options._base.extend(definition)
        }
       ......
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
```

如果没有传入 `definition`, 那么

```js
return this.options[type + 's'][id]
```

如果 type 是 component, 并且传入的 `definition` 是一个普通对象，那么通过

```
definition = this.options._base.extend(definition)
```

把 `definition` 转成一个构造器，并且把 

```
Vue.options["components"][id] = definition
```

最后返回构造器 `definition` 。

这里赋值的 `Vue.options` 最终会和自定义配置，被一起合并到 `vm.$options` 中。

这里配的 `Vue.options["components"][id] = definition`, 最终会被应用到下面

#### `_createElement`

`src\core\vdom\create-element.js`

```js
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
......
if (typeof tag === 'string') {
    let Ctor
    ......
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      )
    } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag)
    } else {
      ......
    }
```

如果 tag 为 string, 且是一个保留标签（`html` 标签）, 即下面的语句为 `true`

```
config.isReservedTag(tag)
```

那么创建一个普通的 `VNode`

如果tag满足下面的语句，那么创建一个组件 `VNode`

```js
(!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))
```

运行正常的情况下，

`resolveAsset` 将返回一个构造器赋值给 `Ctor`，然后 `createComponent` 返回组件 `VNode`

```
vnode = createComponent(Ctor, data, context, children, tag)
```

#### `resolveAsset` 

`src\core\util\options.js`

```js
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}
```

下面这里的type, 依旧只看 `type = components` 的情况

```js
 const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
```

首先，在 `options["components"]` 里面找 `id` , 找到直接返回 `options["components"][id]` 对应的值, 也就是 `src\core\global-api\assets.js` `initAssetRegisters`返回的构造器。

找不到就通过 `camelize(id)`, 把 `id` 转成驼峰的形式，然后重复上边的步骤，找id，返回对应的值。

找不到在通过 `capitalize(camelizedId)`, 把 id 转成首字母大写，再次重复，......

如果最后还是没有找到，那么

```js
warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
```

`type.slice(0, -1)` 就是从第一个到倒数第一个字符，对于 `components` 来说

```
components.slice(0, -1)
```

等同于

```
component
```

然后，回到 `src\core\vdom\create-element.js` ，如果找不到 id 对应的值，那么最后就执行

```js
export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
	......
	else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      )
      ......
```

返回一个没有命名的 `VNode`

### 局部注册

`src\core\global-api\extend.js`

```js
Vue.extend = function (extendOptions: Object): Function {
	......
	Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    ......
	if (name) {
    	Sub.options.components[name] = Sub
	}
    ......
```

这里的 `Super.options` 相当于 `Vue.options` ，局部注册最终把 `Vue.options` 和 `extendOptions` 进行合并，这个 Sub 最终将通过

`src\core\instance\init.js`

```
export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  ......
```

这个 Sub 最终将通过

```
const opts = vm.$options = Object.create(vm.constructor.options)
```

被赋值给 `Vue.$options` 。

最后，被 `src\core\util\options.js`  `resolveAsset` 返回到 `_createElement`

### 总结

局部注册组件只能在当前组件中使用，因为它的扩展是扩展在 `Sub.options`

全局注册是扩展到 `Vue.options` ，所有组件创建的时候，都会从全局的 `Vue.options.components` 扩展到当前组件的 `vm.$options.components` 下，详见

`src\core\instance\init.js`

```js
export function initMixin (Vue: Class<Component>) {
 ......
 if(options && options._isComponent){
  ......
 }
 else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
```

以及，

`src\core\global-api\extend.js`

```
Vue.extend = function (extendOptions: Object): Function {
	......
	Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
```

都要用到 `Vue.options`，所以全局注册以后，可以在所有地方使用这个组件。

但是，如果仅仅子组件局部注册，那么配置只扩展在 `Sub.options` 下，

`src\core\global-api\extend.js`

```
Vue.extend = function (extendOptions: Object): Function {
	......
	Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
```

所以只能在当前子组件中使用。







