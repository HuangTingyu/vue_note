## Flow

Flow的作用——类型检查。

类型检查通常有两种方式：

（1）   类型推断。下面这种情况，flow会报错。因为`11`不是string类型。

```javascript
/*@flow*/
function split(str){
  return str.split(' ')
}
split(11)
```

（2）   类型注释。下面这种情况，flow会报错。因为`Hello`不是number类型。

```javascript
/*@flow*/
function add(x:number,y:number):number{
  return x + y
}
add('Hello',11)
```

（3）类的类型注释。下面这种会报错，因为z没有赋值。

```javascript
/*@flow*/
class Bar{
  x:string;
  y:string | number;
  z:boolean;

  constructor(x:string,y:string|number){
    this.x = x
    this.y = y
    this.z = false
  }
}
var bar:Bar = new Bar('hello',4)
```

（4）数组的类型注释。下面这种会报错，因为hello不是number。

```javascript
/*@flow*/
var arr:Array<number> = [1,2,3]
arr.push('hello')
```

### 应用(Vue中类型注释的使用)

目标Vue源码下面的Flow文件夹。`:?`这表示类型T可以为`null`或者`undefined`。

```
declare type CompilerOptions = {
  warn?: Function; // allow customizing warning in different environments; e.g. node
  modules?: Array<ModuleOptions>; // platform specific modules; e.g. style; class
  directives?: { [key: string]: Function }; // platform specific directives
  staticKeys?: string; // a list of AST properties to be considered static; for optimization
  isUnaryTag?: (tag: string) => ?boolean; // check if a tag is unary for the platform
```

