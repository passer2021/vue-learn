function defineReactive (obj, key, val) {
    // 递归
    observe(val);
    const dep = new Dep()
    Object.defineProperty(obj, key, {
      get() {
        // 依赖收集建立
        Dep.target && dep.addDep(Dep.target)
        return val
      },
      set(newVal) {
        if (val !== newVal) {
          // 需要递归 有可能赋值一个对象
          observe(newVal);
          val = newVal
          // 通知更新
          dep.notify()
        }
      }
    })
  }
  
  // 遍历传入obj的所有属性，执行响应式处理
  function observe(obj) {
    //首先判断obj是对象
    if (typeof obj !== "object" || obj == null) {
      return obj;
    }
    Object.keys(obj).forEach(key => defineReactive(obj, key, obj[key]))
  }
  // 代理data中的属性
  function proxy(vm) {
    Object.keys(vm.$data).forEach(key => {
      Object.defineProperty(vm, key, {
        get() {
          return vm.$data[key]
        },
        set(val) {
          vm.$data[key] = val
        }
      })
    })
  }
  
  class KVue {
    constructor(options) {
      // 0.保存选项
      this.$options = options;
      this.$data = options.data;
      // 1.响应式: 递归遍历data中的对象，做响应式处理
      observe(this.$data)
      // 1.5.代理
      proxy(this);
      if(options.el) {
          this.$mount(options.el)
      }
    }
    $mount(el) {
        // 获取宿主
       this.$el = document.querySelector(el)
        // 实现更新函数
        const updateComponent = () => {
            // dom 版本
            // 执行render, 获取视图结构
            // const el = this.$options.render.call(this)
            // const parent = this.$el.parentElement
            // parent.insertBefore(el, this.$el.nextSibling)
            // parent.removeChild(this.$el)
            // this.$el = el
            // vdom版本
            const vnode = this.$options.render.call(this, this.$creatElement)
            this._update(vnode)
        }
        // 创建Watcher实例
        new Watcher(this, updateComponent)
    }

    $creatElement(tag, data, children) {
        return {tag, data, children}
    }
    _update(vnode) {
        const preVnode = this._vnode
        if(!preVnode) {
            // 初始化
            this.__patch__(this.$el, vnode)
        } else {
            // 更新
            this.__patch__(preVnode, vnode)
        }
    }

    __patch__(oldVnode, vnode) {
        // 首次进来oldVnode是dom
        if(oldVnode.nodeType) {
            // 递归创建
            const el = this.createElm(vnode)
            const parent = oldVnode.parentElement
            const refElem = oldVnode.nextSibling
            parent.insertBefore(el, refElem)
            parent.removeChild(oldVnode)
        } else {
            const el = vnode.el = oldVnode.el
            if(oldVnode.tag === vnode.tag) {
                const oldCh = oldVnode.children
                const newCh = vnode.children
                if(typeof newCh === 'string') {
                    if(typeof oldCh === 'string') {
                        // 文本更新
                        if(newCh !== oldCh) {
                            el.textContent = newCh
                        }
                    } else {
                        el.textContent = newCh
                    }
                } else {
                    if (typeof oldCh === 'string') {
                        el.innerHtml = ''
                        newCh.forEach(child => el.appendChild(this.createElm(child)))
                    } else {
                        this.updateChildren(el, oldCh, newCh)
                    }
                }
            }
        }
        // 保存上次的vnode
        this._vnode = vnode
    }

    updateChildren(el, oldCh, newCh) {
        const len = Math.min(oldCh.length, newCh.length)
        for(let i = 0; i < len; i++) {
            this.__patch__(oldCh[i], newCh[i])
        }
        if(newCh.length > oldCh.length) {
            newCh.slice(len).forEach(child => {
                const _el = this.createElm(child)
                el.appendChild(_el)
            })
        } else if (newCh.length < oldCh.length) {
            oldCh.slice(len).forEach(child => el.removeChild(child.el))
        }
    }

    createElm(vnode) {
        // 递归创建整颗dom树
        const el = document.createElement(vnode.tag)
        if(vnode.children) {
            if (typeof vnode.children === 'string') {
                el.textContent = vnode.children
            } else {
                vnode.children.forEach(n => {
                   el.appendChild(this.createElm(n))
                })
            }
        }
        // 保存vnode 和 el 之间的关系,将来更新需要用到
        vnode.el = el
        return el
    }
  }
  
  // 负责具体节点更新
  class Watcher {
    constructor(vm, updater) {
        this.vm = vm
        this.getter = updater
        this.get()
    }
    get() {
        // 读当前值，触发依赖收集
        Dep.target = this
        this.getter.call(this.vm)
        Dep.target = null
    }
    // Dep将来会调用update
    update() {
        this.get()
    }
  }
  // Dep和响应式的属性key之间有一一对应关系
  // 负责通知watchers更新
  class Dep {
    constructor() {
        this.deps = new Set()
    }
    addDep(dep) {
        this.deps.add(dep)
    }
    notify() {
        this.deps.forEach(dep => dep.update())
    }
  }
  