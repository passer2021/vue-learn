// Vue.util.defineReactive(this, 'current', '/')

// 数组响应式
// 1.替换原型数组中的7个方法
const originalProto = Array.prototype;
// 备份一下， 修改备份
const arrayProto = Object.create(originalProto);
['push', 'pop', 'shift', 'unshift'].forEach(method => {
  arrayProto[method] = function() {
    // 原始操作
    originalProto[method].apply(this, arguments)
    // 覆盖操作,通知更新
    console.log(`数组执行了${method}操作`)
  }

})

// 对象响应式
function defineReactive(obj, key, val) {
  // 递归
  observe(val)
  
  // 属性拦截
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', key);
      return val
    },
    set(newVal) {
      if (newVal !== val) {
        console.log('set', key);
        observe(newVal)
        val = newVal
        // update()
      }
    }
  })
}

// 遍历传入obj的所有属性，执行响应式处理
function observe(obj) {
  //首先判断obj是对象
  if (typeof obj !== 'object' || obj == null) {
    return obj
  }
  // 判断obj类型
  if(Array.isArray(obj)) {
    // 覆盖原型，替换7个变更操作
    obj.__proto__ = arrayProto
    // 对数组内部的元素执行响应化
    const keys = Object.keys(obj)
    for(let i = 0; i < keys.length; i++) {
      observe(obj[i])
    }
  } else {
    Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]))
  }
}

// 动态新增一个属性
// Vue.set(obj, key, val)
function set(obj, key, val) {
  defineReactive(obj, key, val)
}

const obj = {
  foo: 'foo',
  bar: 'bar',
  baz: {
    a: 1
  },
  arr: [1, 2, 3]
}
// 1.用户不能够手动设置所有属性：递归响应式处理过程
// defineReactive(obj, 'foo', 'foo')
observe(obj)
// obj.foo
// obj.foo = 'foooo'
// obj.bar
// obj.bar = 'barrr'
// obj.baz
// obj.baz.a
// obj.dong = 'dong'
set(obj, 'dong', 'dong')
obj.dong

obj.baz = {
  a: 10
}

// 2.数组：支持不了
// 解决方案是：要拦截数组的7个变更方法，覆盖他们，让他们做数组操作的同时，进行变更通知
obj.arr.push(4)